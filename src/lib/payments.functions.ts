/**
 * payments.functions.ts
 *
 * TanStack server functions for Paystack payment processing.
 * Runs on Cloudflare Workers (server-side only — not exposed to browser).
 *
 * Exports:
 * - initializePayment: Creates an order and returns Paystack auth URL (or confirms free tickets directly)
 * - verifyPayment: Verifies a Paystack reference after callback, confirms order, generates tickets, sends emails
 *
 * Dependencies: supabaseAdmin (service role), Resend (via email.server.ts), Paystack REST API
 */
import { createServerFn } from "@tanstack/react-start";




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
      .select("*, events(title, status, event_date, event_time)")
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

    // Sales close 12 hours after the event starts.
    const evDate = ticketType.events?.event_date;
    const evTime = ticketType.events?.event_time;
    if (evDate) {
      const eventStart = new Date(`${evDate}T${evTime ?? "00:00:00"}`);
      const salesCutoff = new Date(eventStart.getTime() + 12 * 60 * 60 * 1000);
      if (new Date() > salesCutoff) {
        return {
          error:
            "Ticket sales for this event have closed. Sales ended 12 hours after the event started." as const,
        };
      }
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
    const { fulfilPaidOrder, verifyWithPaystack } = await import("@/lib/fulfilment.server");
    const sb = supabaseAdmin as any;

    const verified = await verifyWithPaystack(data.reference);
    if (!verified.ok) {
      await sb
        .from("orders")
        .update({ status: "failed" })
        .eq("paystack_reference", data.reference)
        .neq("status", "confirmed");
      return { success: false as const, error: verified.error };
    }

    const result = await fulfilPaidOrder(sb, {
      reference: data.reference,
      verifiedData: verified.data,
      amount: Number(verified.data?.amount ?? 0) / 100 || undefined,
    });
    if (!result.success) return { success: false as const, error: result.error };
    return { success: true as const, orderId: result.orderId };
  });

/**
 * Self-healing recovery: if a webhook was missed and an order is still pending,
 * re-verify it against Paystack and fulfil it. Safe to call repeatedly.
 * Called by the order-confirmation page for any non-confirmed order.
 */
export const reconcileOrder = createServerFn({ method: "POST" })
  .inputValidator((data: { orderId: string }) => {
    if (!data || typeof data.orderId !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fulfilPaidOrder, verifyWithPaystack, ensureTicketsForOrder } = await import(
      "@/lib/fulfilment.server"
    );
    const sb = supabaseAdmin as any;

    const { data: order } = await sb
      .from("orders")
      .select("id, status, quantity, event_id, ticket_type_id, paystack_reference")
      .eq("id", data.orderId)
      .maybeSingle();

    if (!order) return { success: false as const, error: "Order not found" };

    if (order.status === "confirmed") {
      // Confirmed but possibly missing ticket rows — heal those too.
      await ensureTicketsForOrder(sb, {
        id: order.id,
        event_id: order.event_id,
        ticket_type_id: order.ticket_type_id,
        quantity: Number(order.quantity),
      });
      return { success: true as const, orderId: order.id as string, fulfilledNow: false };
    }

    if (!order.paystack_reference) {
      return { success: false as const, error: "No payment reference on this order" };
    }

    const verified = await verifyWithPaystack(order.paystack_reference);
    if (!verified.ok) return { success: false as const, error: verified.error };

    const result = await fulfilPaidOrder(sb, {
      reference: order.paystack_reference,
      verifiedData: verified.data,
      amount: Number(verified.data?.amount ?? 0) / 100 || undefined,
    });
    if (!result.success) return { success: false as const, error: result.error };
    return {
      success: true as const,
      orderId: result.orderId,
      fulfilledNow: result.fulfilledNow,
    };
  });



    return { success: true as const, orderId: order.id as string };
  });
