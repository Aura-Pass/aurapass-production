import { createServerFn } from "@tanstack/react-start";
import { generateTicketCode } from "@/lib/generateTicketCode";
import { sendTicketConfirmationEmail } from "@/lib/email.functions";

async function sendConfirmationEmailSafely(sb: any, orderId: string) {
  try {
    const { data: order } = await sb
      .from("orders")
      .select(
        "id, buyer_name, buyer_email, quantity, total_amount, ticket_price, ticket_types(name), events(title, event_date, event_time, venue, city)",
      )
      .eq("id", orderId)
      .single();
    if (!order) {
      console.error("[sendConfirmationEmailSafely] order not found", orderId);
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY not configured — skipping ticket confirmation email");
      return;
    }
    try {
      await sendTicketConfirmationEmail({
        data: {
          to: order.buyer_email,
          buyerName: order.buyer_name,
          eventTitle: order.events?.title ?? "Your event",
          eventDate: order.events?.event_date ?? "",
          eventTime: order.events?.event_time ?? "",
          eventVenue: order.events?.venue ?? "",
          eventCity: order.events?.city ?? "",
          ticketTypeName: order.ticket_types?.name ?? "Ticket",
          quantity: Number(order.quantity),
          totalAmount: Number(order.total_amount),
          orderId: order.id,
          isFree: Number(order.ticket_price) === 0,
        },
      });
      console.log("✅ Ticket confirmation email sent to", order.buyer_email);
    } catch (emailError) {
      console.error("❌ Failed to send ticket confirmation email:", emailError);
    }
  } catch (err) {
    console.error("[sendConfirmationEmailSafely] failed", err);
  }
}

async function generateTicketsForOrder(
  sb: any,
  order: { id: string; event_id: string; ticket_type_id: string; quantity: number },
) {
  const rows = Array.from({ length: order.quantity }, () => ({
    order_id: order.id,
    event_id: order.event_id,
    ticket_type_id: order.ticket_type_id,
    qr_code: generateTicketCode(order.id),
  }));
  const { error } = await sb.from("tickets").insert(rows);
  if (error) {
    console.error("[generateTicketsForOrder] insert failed", error);
    throw new Error(`Ticket generation failed: ${error.message}`);
  }
}

/**
 * Generate tickets with one retry. Never throws: the order is already paid and
 * confirmed, so a ticket-row failure must not fail the buyer's request. On a
 * final failure we log loudly and alert admins by email.
 */
async function generateTicketsSafely(
  sb: any,
  order: { id: string; event_id: string; ticket_type_id: string; quantity: number },
): Promise<boolean> {
  try {
    await generateTicketsForOrder(sb, order);
    return true;
  } catch (firstErr) {
    console.error("[generateTicketsSafely] first attempt failed, retrying", firstErr);
    await new Promise((r) => setTimeout(r, 1500));
    try {
      await generateTicketsForOrder(sb, order);
      console.log("[generateTicketsSafely] retry succeeded for order", order.id);
      return true;
    } catch (secondErr) {
      console.error(
        "🚨 [generateTicketsSafely] ticket generation FAILED after retry for order",
        order.id,
        secondErr,
      );
      try {
        const { data: row } = await sb
          .from("orders")
          .select("buyer_email, events(title)")
          .eq("id", order.id)
          .maybeSingle();
        const { sendAdminTicketGenerationFailureEmail } = await import("@/lib/email.server");
        await sendAdminTicketGenerationFailureEmail({
          orderId: order.id,
          eventTitle: row?.events?.title ?? "Unknown event",
          buyerEmail: row?.buyer_email ?? "unknown",
          quantity: order.quantity,
          errorMessage: secondErr instanceof Error ? secondErr.message : String(secondErr),
        });
      } catch (alertErr) {
        console.error("[generateTicketsSafely] admin alert failed", alertErr);
      }
      return false;
    }
  }
}

interface MerchSelection {
  merchItemId: string;
  quantity: number;
}

interface InitInput {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  userId?: string | null;
  callbackUrl: string;
  merchItems?: MerchSelection[];
  referralCode?: string | null;
}

export const initializePayment = createServerFn({ method: "POST" })
  .inputValidator((data: InitInput) => {
    if (
      !data ||
      typeof data.eventId !== "string" ||
      typeof data.ticketTypeId !== "string" ||
      typeof data.quantity !== "number" ||
      !Number.isInteger(data.quantity) ||
      typeof data.buyerName !== "string" ||
      typeof data.buyerEmail !== "string" ||
      typeof data.buyerPhone !== "string" ||
      typeof data.callbackUrl !== "string"
    ) {
      throw new Error("Invalid input");
    }
    if (data.quantity < 1 || data.quantity > 10) {
      throw new Error("You can purchase between 1 and 10 tickets per order");
    }
    if (data.merchItems !== undefined) {
      if (!Array.isArray(data.merchItems)) throw new Error("Invalid merch selection");
      for (const m of data.merchItems) {
        if (
          !m ||
          typeof m.merchItemId !== "string" ||
          typeof m.quantity !== "number" ||
          !Number.isInteger(m.quantity) ||
          m.quantity < 1 ||
          m.quantity > 10
        ) {
          throw new Error("Invalid merch selection");
        }
      }
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const { data: ticketType, error: ticketError } = await sb
      .from("ticket_types")
      .select("*, events(title, status)")
      .eq("id", data.ticketTypeId)
      .single();

    if (ticketError || !ticketType) {
      return { error: "Ticket type not found" as const };
    }

    if (ticketType.events?.status !== "published") {
      return { error: "This event is not currently available for purchase." as const };
    }

    if (ticketType.is_hidden === true) {
      return { error: "This event is not currently available for purchase." as const };
    }

    const now = Date.now();
    if (ticketType.sale_start && now < new Date(ticketType.sale_start).getTime()) {
      return { error: "Ticket sales are not currently open for this ticket type." as const };
    }
    if (ticketType.sale_end && now > new Date(ticketType.sale_end).getTime()) {
      return { error: "Ticket sales are not currently open for this ticket type." as const };
    }

    if (ticketType.quantity - ticketType.quantity_sold < data.quantity) {
      return { error: "Not enough tickets available" as const };
    }

    // --- Merch: validate selections server-side, never trust client-sent prices ---
    const merchSelections = data.merchItems ?? [];
    let merchSubtotal = 0;
    const merchRows: {
      merch_item_id: string;
      item_name: string;
      unit_price: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    if (merchSelections.length > 0) {
      const merchIds = merchSelections.map((m) => m.merchItemId);
      const { data: merchItemsDb, error: merchErr } = await sb
        .from("event_merch_items")
        .select("id, name, price, is_active, event_id, quantity_available, quantity_sold")
        .in("id", merchIds);

      if (merchErr) {
        return { error: "Could not load merch items" as const };
      }

      for (const sel of merchSelections) {
        const item = merchItemsDb?.find((m: any) => m.id === sel.merchItemId);
        if (!item || item.event_id !== data.eventId || item.is_active !== true) {
          return { error: "One or more selected merch items are no longer available." as const };
        }
        if (item.quantity_available != null) {
          const remaining = item.quantity_available - item.quantity_sold;
          if (sel.quantity > remaining) {
            return { error: `Only ${remaining} left of "${item.name}".` as const };
          }
        }
        const unitPrice = Number(item.price);
        const rowSubtotal = unitPrice * sel.quantity;
        merchSubtotal += rowSubtotal;
        merchRows.push({
          merch_item_id: item.id,
          item_name: item.name,
          unit_price: unitPrice,
          quantity: sel.quantity,
          subtotal: rowSubtotal,
        });
      }
    }

    const ticketPrice = Number(ticketType.price);
    const ticketSubtotal = ticketPrice * data.quantity;
    const combinedSubtotal = ticketSubtotal + merchSubtotal;
    const isFree = combinedSubtotal === 0;
    const platformFee = isFree ? 0 : Math.round(combinedSubtotal * 0.035 + 100);
    const totalAmount = combinedSubtotal + platformFee;

    let referredBy: string | null = null;
    if (data.referralCode) {
      const { data: marketerId } = await sb.rpc("resolve_referral_code", {
        p_event_id: data.eventId,
        p_referral_code: data.referralCode,
      });
      referredBy = (marketerId as string | null) ?? null;
    }

    const { data: order, error: orderError } = await sb
      .from("orders")
      .insert({
        event_id: data.eventId,
        ticket_type_id: data.ticketTypeId,
        buyer_name: data.buyerName,
        buyer_email: data.buyerEmail,
        buyer_phone: data.buyerPhone,
        quantity: data.quantity,
        ticket_price: ticketPrice,
        platform_fee: platformFee,
        total_amount: totalAmount,
        status: isFree ? "confirmed" : "pending",
        user_id: data.userId || null,
        referred_by: referredBy,
      })
      .select()
      .single();

    if (orderError || !order) {
      return { error: "Could not create order" as const };
    }

    if (merchRows.length > 0) {
      const { error: merchInsertErr } = await sb
        .from("order_merch_items")
        .insert(merchRows.map((r) => ({ ...r, order_id: order.id })));
      if (merchInsertErr) {
        // Log loudly but don't fail the whole checkout over a line-item record —
        // the order and payment are the source of truth for money owed.
        console.error("[initializePayment] order_merch_items insert failed", merchInsertErr);
      }
    }

    if (isFree) {
      await sb
        .from("ticket_types")
        .update({ quantity_sold: ticketType.quantity_sold + data.quantity })
        .eq("id", data.ticketTypeId);

      for (const r of merchRows) {
        const { data: mi } = await sb
          .from("event_merch_items")
          .select("quantity_sold")
          .eq("id", r.merch_item_id)
          .single();
        if (mi) {
          await sb
            .from("event_merch_items")
            .update({ quantity_sold: mi.quantity_sold + r.quantity })
            .eq("id", r.merch_item_id);
        }
      }

      await generateTicketsSafely(sb, {
        id: order.id,
        event_id: data.eventId,
        ticket_type_id: data.ticketTypeId,
        quantity: data.quantity,
      });

      await sendConfirmationEmailSafely(sb, order.id);

      return { free: true as const, orderId: order.id as string };
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { error: "Payment provider not configured" as const };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.buyerEmail,
        amount: Math.round(totalAmount * 100),
        callback_url: data.callbackUrl,
        metadata: { order_id: order.id, event_title: ticketType.events?.title },
      }),
    });

    const paystackData = (await paystackRes.json()) as any;

    if (!paystackData?.status) {
      return { error: "Could not initialize payment" as const };
    }

    await sb
      .from("orders")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", order.id);

    return {
      free: false as const,
      authorizationUrl: paystackData.data.authorization_url as string,
      reference: paystackData.data.reference as string,
      orderId: order.id as string,
    };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((data: { reference: string }) => {
    if (!data || typeof data.reference !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { success: false, error: "Payment provider not configured" };

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(data.reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const verifyData = (await verifyRes.json()) as any;

    if (!verifyData?.status || verifyData.data?.status !== "success") {
      await sb.from("orders").update({ status: "failed" }).eq("paystack_reference", data.reference);
      return { success: false as const };
    }

    const { data: order } = await sb
      .from("orders")
      .select("*")
      .eq("paystack_reference", data.reference)
      .single();

    if (!order) return { success: false as const, error: "Order not found" };

    if (order.status !== "confirmed") {
      await sb.from("orders").update({ status: "confirmed" }).eq("id", order.id);

      const { data: ticketType } = await sb
        .from("ticket_types")
        .select("quantity_sold")
        .eq("id", order.ticket_type_id)
        .single();

      if (ticketType) {
        await sb
          .from("ticket_types")
          .update({ quantity_sold: ticketType.quantity_sold + order.quantity })
          .eq("id", order.ticket_type_id);
      }

      const { data: orderMerch } = await sb
        .from("order_merch_items")
        .select("merch_item_id, quantity")
        .eq("order_id", order.id);
      for (const om of orderMerch ?? []) {
        const { data: mi } = await sb
          .from("event_merch_items")
          .select("quantity_sold")
          .eq("id", om.merch_item_id)
          .single();
        if (mi) {
          await sb
            .from("event_merch_items")
            .update({ quantity_sold: mi.quantity_sold + om.quantity })
            .eq("id", om.merch_item_id);
        }
      }

      await sb.from("payments").insert({
        order_id: order.id,
        paystack_reference: data.reference,
        amount: order.total_amount,
        status: "success",
        paid_at: new Date().toISOString(),
        raw_response: verifyData.data,
      });

      await generateTicketsSafely(sb, {
        id: order.id,
        event_id: order.event_id,
        ticket_type_id: order.ticket_type_id,
        quantity: order.quantity,
      });

      await sendConfirmationEmailSafely(sb, order.id);
    }

    return { success: true as const, orderId: order.id as string };
  });

export const reconcileOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string }) => {
    if (!data || typeof data.orderId !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const { data: order } = await sb
      .from("orders")
      .select(
        "id, status, quantity, event_id, ticket_type_id, paystack_reference, total_amount",
      )
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return { success: false as const, error: "Order not found" };

    if (order.status === "confirmed") {
      const { data: existingTickets } = await sb
        .from("tickets")
        .select("id")
        .eq("order_id", order.id);
      const missing = Number(order.quantity) - (existingTickets?.length ?? 0);
      if (missing > 0) {
        await generateTicketsSafely(sb, {
          id: order.id,
          event_id: order.event_id,
          ticket_type_id: order.ticket_type_id,
          quantity: missing,
        });
      }
      return {
        success: true as const,
        orderId: order.id as string,
        fulfilledNow: false,
      };
    }

    if (!order.paystack_reference) {
      return { success: false as const, error: "No payment reference on this order" };
    }

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { success: false as const, error: "Payment provider not configured" };

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(order.paystack_reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } },
    );
    const verifyData = (await verifyRes.json()) as any;

    if (!verifyData?.status || verifyData.data?.status !== "success") {
      await sb
        .from("orders")
        .update({ status: "failed" })
        .eq("paystack_reference", order.paystack_reference);
      return { success: false as const };
    }

    await sb.from("orders").update({ status: "confirmed" }).eq("id", order.id);

    const { data: ticketType } = await sb
      .from("ticket_types")
      .select("quantity_sold")
      .eq("id", order.ticket_type_id)
      .single();

    if (ticketType) {
      await sb
        .from("ticket_types")
        .update({ quantity_sold: ticketType.quantity_sold + order.quantity })
        .eq("id", order.ticket_type_id);
    }

    const { data: orderMerch } = await sb
      .from("order_merch_items")
      .select("merch_item_id, quantity")
      .eq("order_id", order.id);
    for (const om of orderMerch ?? []) {
      const { data: mi } = await sb.from("event_merch_items").select("quantity_sold").eq("id", om.merch_item_id).single();
      if (mi) await sb.from("event_merch_items").update({ quantity_sold: mi.quantity_sold + om.quantity }).eq("id", om.merch_item_id);
    }

    await sb.from("payments").insert({
      order_id: order.id,
      paystack_reference: order.paystack_reference,
      amount: order.total_amount,
      status: "success",
      paid_at: new Date().toISOString(),
      raw_response: verifyData.data,
    });

    await generateTicketsSafely(sb, {
      id: order.id,
      event_id: order.event_id,
      ticket_type_id: order.ticket_type_id,
      quantity: order.quantity,
    });

    await sendConfirmationEmailSafely(sb, order.id);

    return {
      success: true as const,
      orderId: order.id as string,
      fulfilledNow: true,
    };
  });
