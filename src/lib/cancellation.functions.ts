/**
 * cancellation.functions.ts
 *
 * Two-step cancellation workflow:
 * - Organisers REQUEST cancellation (admin gets notified)
 * - Admin APPROVES (refunds fire, buyers emailed) or DECLINES (with remark)
 */
import { createServerFn } from "@tanstack/react-start";

type RequestInput = { eventId: string; organiserId: string; reason: string };
type AdminActionInput = { eventId: string; adminRemark: string };

export const requestEventCancellation = createServerFn({ method: "POST" })
  .inputValidator((data: RequestInput) => {
    if (
      !data ||
      typeof data.eventId !== "string" ||
      typeof data.organiserId !== "string" ||
      typeof data.reason !== "string" ||
      data.reason.trim().length < 20
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: event, error } = await (supabaseAdmin as any)
      .from("events")
      .select("id, title, organiser_id, status, cancelled_at, cancellation_status")
      .eq("id", data.eventId)
      .single();

    if (error || !event) throw new Error("Event not found");
    if (event.organiser_id !== data.organiserId) throw new Error("Unauthorised");
    if (event.cancelled_at) throw new Error("Event already cancelled");
    if (event.cancellation_status === "requested")
      throw new Error("Cancellation already requested");

    await (supabaseAdmin as any)
      .from("events")
      .update({
        cancellation_requested_at: new Date().toISOString(),
        cancellation_request_reason: data.reason,
        cancellation_status: "requested",
        cancellation_admin_remark: null,
      })
      .eq("id", data.eventId);

    try {
      const { sendAdminCancellationRequestEmail } = await import("@/lib/email.server");
      await sendAdminCancellationRequestEmail({
        eventTitle: String(event.title),
        reason: data.reason,
      });
    } catch (e) {
      console.error("[cancellation request email]", e);
    }

    return { success: true };
  });

export const approveEventCancellation = createServerFn({ method: "POST" })
  .inputValidator((data: AdminActionInput) => {
    if (
      !data ||
      typeof data.eventId !== "string" ||
      typeof data.adminRemark !== "string" ||
      data.adminRemark.trim().length < 10
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    const { data: event, error } = await (supabaseAdmin as any)
      .from("events")
      .select("id, title, organiser_id, cancellation_request_reason")
      .eq("id", data.eventId)
      .single();

    if (error || !event) throw new Error("Event not found");

    const reason = event.cancellation_request_reason ?? "Event cancelled";

    await (supabaseAdmin as any)
      .from("events")
      .update({
        status: "ended",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        cancellation_status: "approved",
        cancellation_admin_remark: data.adminRemark.trim(),
      })
      .eq("id", data.eventId);

    const { data: orders } = await (supabaseAdmin as any)
      .from("orders")
      .select("id, buyer_name, buyer_email, total_amount, paystack_reference, ticket_price")
      .eq("event_id", data.eventId)
      .eq("status", "confirmed")
      .not("paystack_reference", "is", null)
      .gt("ticket_price", 0);

    const results = { refunded: 0, failed: 0 };

    for (const order of (orders ?? []) as any[]) {
      try {
        if (!paystackSecret) {
          results.failed++;
          console.error("[refund] PAYSTACK_SECRET_KEY not configured");
          continue;
        }
        const refundRes = await fetch("https://api.paystack.co/refund", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transaction: order.paystack_reference,
            amount: Math.round(Number(order.total_amount) * 100),
          }),
        });
        const refundData: any = await refundRes.json();

        if (refundData?.status) {
          await (supabaseAdmin as any)
            .from("orders")
            .update({
              status: "refunded",
              refunded_at: new Date().toISOString(),
              refund_reference: String(refundData.data?.id ?? "processed"),
            })
            .eq("id", order.id);

          await sendRefundEmail({
            to: String(order.buyer_email ?? ""),
            buyerName: String(order.buyer_name ?? "Guest"),
            eventTitle: String(event.title),
            amount: Number(order.total_amount),
            reason,
          }).catch((e) => console.error("[refund email]", e));

          results.refunded++;
        } else {
          results.failed++;
          console.error(`[refund] Failed for order ${order.id}:`, refundData);
        }
      } catch (err) {
        results.failed++;
        console.error(`[refund] Error for order ${order.id}:`, err);
      }
    }

    return { success: true, results };
  });

export const declineEventCancellation = createServerFn({ method: "POST" })
  .inputValidator((data: AdminActionInput) => {
    if (
      !data ||
      typeof data.eventId !== "string" ||
      typeof data.adminRemark !== "string" ||
      data.adminRemark.trim().length < 10
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await (supabaseAdmin as any)
      .from("events")
      .update({
        cancellation_status: "declined",
        cancellation_admin_remark: data.adminRemark.trim(),
        cancellation_requested_at: null,
        cancellation_request_reason: null,
      })
      .eq("id", data.eventId);

    return { success: true };
  });

async function sendRefundEmail(args: {
  to: string;
  buyerName: string;
  eventTitle: string;
  amount: number;
  reason: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return;
  const { to, buyerName, eventTitle, amount, reason } = args;
  const amountStr = Number(amount).toLocaleString("en-NG");

  const html = `<!DOCTYPE html><html><body style="margin:0;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#F9FAFB;padding:24px;color:#111827">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
    <div style="padding:20px 24px;border-bottom:1px solid #E5E7EB;font-size:22px;font-weight:800">
      <span style="color:#111827">aura</span><span style="color:#D946EF">pass</span>
    </div>
    <div style="padding:24px">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:40px">💸</div>
        <h1 style="margin:8px 0 4px;font-size:22px">Refund Processed</h1>
        <p style="margin:0;color:#6B7280;font-size:14px">Your refund is on its way.</p>
      </div>
      <p style="font-size:15px">Hi ${escapeHtml(buyerName)},</p>
      <p style="font-size:15px;line-height:1.55">
        The event <strong>${escapeHtml(eventTitle)}</strong> has been cancelled by the organiser.
        We have processed a full refund of <strong>₦${amountStr}</strong> to your original payment method.
      </p>
      <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:12px 14px;margin:16px 0">
        <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#B91C1C;text-transform:uppercase;letter-spacing:0.04em">Reason for cancellation</p>
        <p style="margin:0;font-size:14px;color:#7F1D1D;white-space:pre-wrap">${escapeHtml(reason)}</p>
      </div>
      <p style="font-size:14px;color:#6B7280;line-height:1.55">
        Refunds typically appear in your account within 3–10 business days depending on your bank.
      </p>
      <p style="font-size:14px;color:#6B7280">
        Questions? Contact <a href="mailto:support@aurapassticket.com" style="color:#D946EF;text-decoration:none">support@aurapassticket.com</a> or reach us on WhatsApp.
      </p>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #E5E7EB;text-align:center;font-size:12px;color:#9CA3AF">
      © 2026 AuraPass · aurapassticket.com
    </div>
  </div>
  </body></html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AuraPass <noreply@aurapassticket.com>",
      to: [to],
      subject: `Refund processed — ${eventTitle} has been cancelled`,
      html,
    }),
  });
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
