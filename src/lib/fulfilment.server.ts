/**
 * fulfilment.server.ts
 *
 * Single, idempotent fulfilment path for paid ticket orders.
 *
 * Called from three places:
 *  - the Paystack `charge.success` webhook (src/routes/api/public/paystack-webhook.ts)
 *  - the browser callback verification (verifyPayment)
 *  - the self-healing reconcile path (reconcileOrder), for missed webhooks
 *
 * Whichever arrives first fulfils the order; later calls are no-ops.
 * Server-only: uses the service-role Supabase client.
 */
import { generateTicketCode } from "@/lib/generateTicketCode";

type Sb = any;

export async function sendConfirmationEmailSafely(sb: Sb, orderId: string) {
  try {
    const { data: order } = await sb
      .from("orders")
      .select(
        "id, buyer_name, buyer_email, quantity, total_amount, ticket_price, ticket_types(name), events(title, event_date, event_time, venue, city)",
      )
      .eq("id", orderId)
      .single();
    if (!order) {
      console.error("[fulfilment] email skipped, order not found", orderId);
      return;
    }
    if (!process.env.RESEND_API_KEY) {
      console.error("[fulfilment] RESEND_API_KEY not configured — skipping email");
      return;
    }
    const { sendTicketConfirmationEmailImpl } = await import("@/lib/email.server");
    await sendTicketConfirmationEmailImpl({
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
    });
    console.log("[fulfilment] confirmation email sent for order", orderId);
  } catch (err) {
    console.error("[fulfilment] email failed for order", orderId, err);
    // Never re-throw — email failure must not block fulfilment
  }
}

/**
 * Ensures exactly `quantity` ticket rows exist for an order.
 * Safe to call repeatedly — it only creates the missing ones.
 */
export async function ensureTicketsForOrder(
  sb: Sb,
  order: { id: string; event_id: string; ticket_type_id: string; quantity: number },
): Promise<{ created: number; existing: number }> {
  const countTickets = async () => {
    const { count, error } = await sb
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id);
    if (error) {
      console.error("[fulfilment] ticket count failed", error);
      throw new Error(`Ticket count failed: ${error.message}`);
    }
    return Number(count ?? 0);
  };

  const existing = await countTickets();

  // Always attempt all sequence numbers; the unique (order_id, ticket_sequence)
  // constraint decides what actually gets inserted. Concurrent callers can both
  // run this safely — duplicates are silently ignored.
  const rows = Array.from({ length: order.quantity }, (_, i) => ({
    order_id: order.id,
    event_id: order.event_id,
    ticket_type_id: order.ticket_type_id,
    ticket_sequence: i + 1,
    qr_code: generateTicketCode(order.id),
  }));

  const { error } = await sb
    .from("tickets")
    .upsert(rows, { onConflict: "order_id,ticket_sequence", ignoreDuplicates: true });
  if (error) {
    console.error("[fulfilment] ticket upsert failed", error);
    throw new Error(`Ticket generation failed: ${error.message}`);
  }

  const total = await countTickets();
  return { created: Math.max(0, total - existing), existing };
}

export interface FulfilResult {
  success: true;
  orderId: string;
  /** true when this call performed the confirmation (first writer wins) */
  fulfilledNow: boolean;
  ticketsCreated: number;
}

/**
 * Idempotently fulfils a successful Paystack transaction.
 *
 * Concurrency safety: the order row is claimed with a conditional UPDATE
 * (`status <> 'confirmed'`). Only the caller whose update returns a row does
 * the one-time side effects (stock increment, payment record, email).
 * Ticket rows are reconciled by count either way, so a crash mid-way
 * self-heals on the next call.
 */
export async function fulfilPaidOrder(
  sb: Sb,
  params: { reference: string; verifiedData?: unknown; amount?: number },
): Promise<FulfilResult | { success: false; error: string }> {
  const { reference } = params;

  const { data: order } = await sb
    .from("orders")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!order) return { success: false, error: "Order not found" };

  // Atomic claim — only one concurrent caller gets a row back.
  const { data: claimed } = await sb
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", order.id)
    .neq("status", "confirmed")
    .select("id")
    .maybeSingle();

  const fulfilledNow = Boolean(claimed);

  if (fulfilledNow) {
    // Atomic single-statement increment — no read-then-write race.
    const { error: incError } = await sb.rpc("increment_ticket_type_sold", {
      _ticket_type_id: order.ticket_type_id,
      _by: order.quantity,
    });
    if (incError) {
      console.error("[fulfilment] stock increment failed", incError);
    }

    // paystack_reference is UNIQUE — a duplicate here just means another
    // path already recorded the payment, which is fine.
    const { error: paymentError } = await sb.from("payments").insert({
      order_id: order.id,
      paystack_reference: reference,
      amount: params.amount ?? order.total_amount,
      status: "success",
      paid_at: new Date().toISOString(),
      raw_response: params.verifiedData ?? null,
    });
    if (paymentError && !String(paymentError.code) .startsWith("23")) {
      console.error("[fulfilment] payment insert failed", paymentError);
    }
  }

  const { created } = await ensureTicketsForOrder(sb, {
    id: order.id,
    event_id: order.event_id,
    ticket_type_id: order.ticket_type_id,
    quantity: Number(order.quantity),
  });

  // Atomic email claim — only the caller that flips the column from null sends.
  const { data: emailClaim } = await sb
    .from("orders")
    .update({ confirmation_email_sent_at: new Date().toISOString() })
    .eq("id", order.id)
    .is("confirmation_email_sent_at", null)
    .select("id")
    .maybeSingle();

  if (emailClaim) {
    await sendConfirmationEmailSafely(sb, order.id);
  }

  return { success: true, orderId: order.id as string, fulfilledNow, ticketsCreated: created };
}

export interface FulfilBookingResult {
  success: true;
  bookingRequestId: string;
  fulfilledNow: boolean;
}

export async function fulfilBookingDeposit(
  sb: Sb,
  params: { reference: string; verifiedData?: unknown; amount?: number },
): Promise<FulfilBookingResult | { success: false; error: string }> {
  const { reference } = params;

  const { data: booking } = await sb
    .from("booking_requests")
    .select("*")
    .eq("paystack_reference", reference)
    .maybeSingle();

  if (!booking) return { success: false, error: "Booking request not found" };

  const { data: claimed } = await sb
    .from("booking_requests")
    .update({ deposit_paid_at: new Date().toISOString(), status: "accepted" })
    .eq("id", booking.id)
    .eq("status", "awaiting_deposit")
    .is("deposit_paid_at", null)
    .select("id")
    .maybeSingle();

  const fulfilledNow = Boolean(claimed);

  if (fulfilledNow) {
    const { error: paymentError } = await sb.from("payments").insert({
      booking_request_id: booking.id,
      paystack_reference: reference,
      amount: params.amount ?? booking.deposit_amount,
      status: "success",
      paid_at: new Date().toISOString(),
      raw_response: params.verifiedData ?? null,
    });
    if (paymentError && !String(paymentError.code).startsWith("23")) {
      console.error("[fulfilment] booking payment insert failed", paymentError);
    }
  }

  return { success: true, bookingRequestId: booking.id as string, fulfilledNow };
}

export async function fulfilBookingBalance(
  sb: Sb,
  params: { reference: string; verifiedData?: unknown; amount?: number },
): Promise<FulfilBookingResult | { success: false; error: string }> {
  const { reference } = params;
  const { data: booking } = await sb
    .from("booking_requests")
    .select("*")
    .eq("balance_paystack_reference", reference)
    .maybeSingle();

  if (!booking) return { success: false, error: "Booking request not found" };

  const { data: claimed } = await sb
    .from("booking_requests")
    .update({ balance_paid_at: new Date().toISOString() })
    .eq("id", booking.id)
    .eq("status", "accepted")
    .not("deposit_paid_at", "is", null)
    .is("balance_paid_at", null)
    .select("id")
    .maybeSingle();

  const fulfilledNow = Boolean(claimed);
  if (fulfilledNow) {
    const { error: paymentError } = await sb.from("payments").insert({
      booking_request_id: booking.id,
      paystack_reference: reference,
      amount: params.amount ?? booking.balance_amount,
      status: "success",
      paid_at: new Date().toISOString(),
      raw_response: params.verifiedData ?? null,
    });
    if (paymentError && !String(paymentError.code).startsWith("23")) {
      console.error("[fulfilment] booking balance payment insert failed", paymentError);
    }
  }
  return { success: true, bookingRequestId: booking.id as string, fulfilledNow };
}



/** Calls Paystack's verify endpoint. Returns the raw `data` object on success. */
export async function verifyWithPaystack(
  reference: string,
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return { ok: false, error: "Payment provider not configured" };

  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );
  const json = (await res.json()) as any;
  if (!json?.status || json.data?.status !== "success") {
    return { ok: false, error: json?.data?.gateway_response || "Transaction not successful" };
  }
  return { ok: true, data: json.data };
}
