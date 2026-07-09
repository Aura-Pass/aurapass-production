import { createServerFn } from "@tanstack/react-start";
import { generateTicketCode } from "@/lib/generateTicketCode";
import { sendTicketConfirmationEmail } from "@/lib/email.functions";

async function sendConfirmationEmailSafely(sb: any, orderId: string) {
  try {
    console.log("[email] starting for order", orderId);
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
          to: String(order.buyer_email ?? ""),
          buyerName: String(order.buyer_name ?? "Guest"),
          eventTitle: String(order.events?.title ?? "Your Event"),
          eventDate: String(order.events?.event_date ?? ""),
          eventTime: String(order.events?.event_time ?? ""),
          eventVenue: String(order.events?.venue ?? ""),
          eventCity: String(order.events?.city ?? ""),
          ticketTypeName: String(order.ticket_types?.name ?? "Ticket"),
          quantity: Number(order.quantity ?? 1),
          totalAmount: Number(order.total_amount ?? 0),
          orderId: String(order.id),
          isFree: Number(order.ticket_price ?? 0) === 0,
        },
      });
      console.log("✅ Ticket confirmation email sent to", order.buyer_email);
    } catch (emailError) {
      console.error("❌ Failed to send ticket confirmation email:", emailError);
      // Never re-throw — email failure must not block the buyer's confirmation page
    }
    console.log("[email] completed for order", orderId);
  } catch (err) {
    console.error("[email] CRITICAL: unhandled error for order", orderId, err);
    // Never re-throw
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


interface InitInput {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  userId?: string | null;
  callbackUrl: string;
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

    const ticketPrice = Number(ticketType.price);
    const subtotal = ticketPrice * data.quantity;
    const isFree = subtotal === 0;
    const platformFee = isFree ? 0 : Math.round(subtotal * 0.035 + 100);
    const totalAmount = subtotal + platformFee;

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
      })
      .select()
      .single();

    if (orderError || !order) {
      return { error: "Could not create order" as const };
    }

    if (isFree) {
      await sb
        .from("ticket_types")
        .update({ quantity_sold: ticketType.quantity_sold + data.quantity })
        .eq("id", data.ticketTypeId);

      await generateTicketsForOrder(sb, {
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

      await sb.from("payments").insert({
        order_id: order.id,
        paystack_reference: data.reference,
        amount: order.total_amount,
        status: "success",
        paid_at: new Date().toISOString(),
        raw_response: verifyData.data,
      });

      await generateTicketsForOrder(sb, {
        id: order.id,
        event_id: order.event_id,
        ticket_type_id: order.ticket_type_id,
        quantity: order.quantity,
      });

      // Ensure ticket rows are fully committed before email fetch
      await new Promise<void>((resolve) => setTimeout(resolve, 1500));

      await sendConfirmationEmailSafely(sb, order.id);
    }


    return { success: true as const, orderId: order.id as string };
  });
