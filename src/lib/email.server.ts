/**
 * email.server.ts
 *
 * All transactional email sending for AuraPass via Resend.
 * Server-side only — never import this in client components.
 *
 * Functions:
 * - sendTicketConfirmationEmail: Sends QR ticket email to buyer after purchase
 * - sendAdminEventSubmissionEmail: Notifies admin when organiser submits/resubmits an event
 * - sendOrganiserTicketSaleEmail: Notifies organiser when a ticket is purchased for their event
 *
 * Sender: AuraPass <noreply@aurapassticket.com>
 */
import QRCode from "qrcode";

export interface TicketConfirmationInput {
  to: string;
  buyerName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventCity: string;
  ticketTypeName: string;
  quantity: number;
  totalAmount: number;
  orderId: string;
  isFree: boolean;
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function row(label: string, value: string, bold = false): string {
  return `<tr>
    <td style="padding:12px 16px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${label}</td>
    <td style="padding:12px 16px;font-size:13px;color:#111827;text-align:right;font-weight:${bold ? 700 : 500};border-bottom:1px solid #F3F4F6;">${escapeHtml(value)}</td>
  </tr>`;
}

export async function sendTicketConfirmationEmailImpl(data: TicketConfirmationInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

  const siteUrl = process.env.SITE_URL ?? "https://aurapassticket.com";
  const confirmationUrl = `${siteUrl}/order-confirmation/${data.orderId}`;

  let formattedDate = data.eventDate;
  try {
    formattedDate = new Date(data.eventDate).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    // fall back to raw value
  }

  const amountDisplay = data.isFree
    ? "Free"
    : `₦${Number(data.totalAmount).toLocaleString("en-NG")}`;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: tickets, error: ticketsError } = await supabaseAdmin
    .from("tickets")
    .select("id, qr_code")
    .eq("order_id", data.orderId);

  if (ticketsError) {
    console.error("[sendTicketConfirmationEmail] failed to fetch tickets", ticketsError);
  }

  const ticketList = tickets ?? [];
  const totalQuantity = ticketList.length || data.quantity;

  const qrSections: string[] = [];
  for (let i = 0; i < ticketList.length; i++) {
    const ticket = ticketList[i];
    try {
      const qrBuffer = await QRCode.toBuffer(ticket.qr_code, {
        width: 300,
        margin: 2,
        color: { dark: "#111827", light: "#FFFFFF" },
      });

      const fileName = `qr-codes/qr-${ticket.id}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("event-banners")
        .upload(fileName, qrBuffer, {
          contentType: "image/png",
          upsert: true,
          cacheControl: "31536000",
        });

      if (uploadError) {
        console.error("[sendTicketConfirmationEmail] QR upload failed", uploadError);
        continue;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("event-banners")
        .getPublicUrl(fileName);
      const qrImageUrl = urlData.publicUrl;

      qrSections.push(`
        <tr><td style="padding:24px 32px;border-top:1px solid #E5E7EB;text-align:center;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">
            ${escapeHtml(data.ticketTypeName)} — Ticket ${i + 1} of ${totalQuantity}
          </p>
          <p style="margin:0 0 16px;font-size:11px;color:#9CA3AF;font-family:monospace;">${escapeHtml(ticket.qr_code)}</p>
          <img src="${qrImageUrl}" width="200" height="200" alt="QR Code for ${escapeHtml(ticket.qr_code)}"
               style="display:block;margin:0 auto;border:1px solid #E5E7EB;border-radius:8px;padding:8px;background:#fff;" />
          <p style="margin:12px 0 0;font-size:12px;color:#6B7280;">Show this QR code at the gate for entry</p>
        </td></tr>`);
    } catch (err) {
      console.error("[sendTicketConfirmationEmail] QR generation failed", err);
    }
  }

  const qrHtml = qrSections.join("");

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Your AuraPass ticket</title>
  </head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
            <tr>
              <td style="padding:24px 32px;background:#111827;color:#FFFFFF;text-align:center;">
                <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">AuraPass</div>
                <div style="font-size:12px;opacity:0.7;margin-top:4px;">Access The Moment</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;text-align:center;">
                <div style="font-size:40px;line-height:1;">🎟️</div>
                <h1 style="margin:16px 0 4px;font-size:24px;font-weight:700;color:#111827;">You're going!</h1>
                <p style="margin:0;color:#6B7280;font-size:14px;">Your ticket has been confirmed</p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;">
                <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">${escapeHtml(data.eventTitle)}</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;">
                  ${row("Date", formattedDate)}
                  ${row("Time", data.eventTime)}
                  ${row("Venue", `${data.eventVenue}, ${data.eventCity}`)}
                  ${row("Ticket", `${data.ticketTypeName} × ${data.quantity}`)}
                  ${row("Total", amountDisplay, true)}
                </table>
              </td>
            </tr>
            ${qrHtml}
            <tr>
              <td style="padding:24px 32px 8px;text-align:center;">
                <a href="${confirmationUrl}" style="display:inline-block;background:#111827;color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">
                  View My Tickets Online
                </a>
                <p style="margin:12px 0 0;font-size:12px;color:#6B7280;">You can also show this email at the gate</p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">
                  Hi ${escapeHtml(data.buyerName)}, thanks for booking with AuraPass.<br />
                  Questions? Reply to this email or visit <a href="https://aurapassticket.com" style="color:#111827;">aurapassticket.com</a>.
                </p>
              </td>
            </tr>
          </table>
          <div style="margin-top:16px;font-size:12px;color:#9CA3AF;text-align:center;">
            © 2026 AuraPass. All rights reserved.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AuraPass <noreply@aurapassticket.com>",
      to: [data.to],
      subject: `Your ticket for ${data.eventTitle} — AuraPass`,
      html,
    }),
  });

  const result = (await response.json()) as any;
  if (!response.ok) {
    console.error("Resend error:", result);
    throw new Error(result?.message ?? "Failed to send email");
  }

  return { success: true as const, qrCount: ticketList.length };
}

export interface AdminEventSubmissionInput {
  eventTitle: string;
  organiserName: string;
  organiserEmail: string;
  eventDate: string;
  eventCity: string;
  eventId: string;
}

export async function sendAdminEventSubmissionEmail(data: AdminEventSubmissionInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[admin-email] RESEND_API_KEY not set");
    return;
  }

  const adminUrl = `https://aurapassticket.com/dashboard/admin`;
  let formattedDate = data.eventDate;
  try {
    formattedDate = new Date(data.eventDate).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    // keep raw
  }

  const row2 = (label: string, value: string) => `<tr>
    <td style="padding:10px 16px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${escapeHtml(label)}</td>
    <td style="padding:10px 16px;font-size:13px;color:#111827;text-align:right;font-weight:500;border-bottom:1px solid #F3F4F6;">${escapeHtml(value)}</td>
  </tr>`;

  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>New event pending review</title></head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
          <tr><td style="padding:20px 32px;background:#111827;color:#FFFFFF;">
            <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">AuraPass</div>
          </td></tr>
          <tr><td style="padding:28px 32px 8px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">New event pending review</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">An organiser has submitted an event for approval.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;">
              ${row2("Event", data.eventTitle)}
              ${row2("Organiser", data.organiserName)}
              ${row2("Email", data.organiserEmail)}
              ${row2("Date", formattedDate)}
              ${row2("City", data.eventCity)}
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;text-align:center;">
            <a href="${adminUrl}" style="display:inline-block;background:#D946EF;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Review Event</a>
          </td></tr>
        </table>
        <div style="margin-top:16px;font-size:12px;color:#9CA3AF;text-align:center;">© 2026 AuraPass · aurapassticket.com</div>
      </td></tr>
    </table>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AuraPass <noreply@aurapassticket.com>",
      to: ["support@aurapassticket.com"],
      subject: `New event for review: ${data.eventTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("[admin-email] Failed to send:", err);
  } else {
    console.log("[admin-email] Sent for event:", data.eventTitle);
  }
}

export interface OrganiserTicketSaleInput {
  organiserEmail: string;
  organiserName: string;
  eventTitle: string;
  eventDate: string;
  buyerName: string;
  ticketTypeName: string;
  quantity: number;
  revenue: number;
  totalTicketsSold: number;
  totalCapacity: number;
}

export async function sendOrganiserTicketSaleEmail(data: OrganiserTicketSaleInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[organiser-email] RESEND_API_KEY not set");
    return;
  }

  let formattedDate = data.eventDate;
  try {
    formattedDate = new Date(data.eventDate).toLocaleDateString("en-NG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    // keep raw
  }

  const dashboardUrl = "https://aurapassticket.com/dashboard/organiser/sales";
  const revenueDisplay = `₦${Number(data.revenue).toLocaleString("en-NG")}`;

  const html = `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>New ticket sold</title></head>
  <body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E5E7EB;">
          <tr><td style="padding:24px 32px;background:#111827;color:#FFFFFF;text-align:center;">
            <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;">AuraPass</div>
          </td></tr>
          <tr><td style="padding:32px;text-align:center;">
            <div style="font-size:40px;line-height:1;">🎉</div>
            <h1 style="margin:16px 0 4px;font-size:22px;font-weight:700;color:#111827;">New ticket sold!</h1>
            <p style="margin:0;color:#6B7280;font-size:14px;">Hi ${escapeHtml(data.organiserName)}, someone just bought a ticket to your event.</p>
          </td></tr>
          <tr><td style="padding:0 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px;">
              ${row("Event", data.eventTitle)}
              ${row("Date", formattedDate)}
              ${row("Buyer", data.buyerName)}
              ${row("Ticket Type", `${data.ticketTypeName} × ${data.quantity}`)}
              ${row("Revenue", revenueDisplay, true)}
              ${row("Progress", `${data.totalTicketsSold} / ${data.totalCapacity} tickets sold`)}
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;text-align:center;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#111827;color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">View Sales Dashboard</a>
          </td></tr>
        </table>
        <div style="margin-top:16px;font-size:12px;color:#9CA3AF;text-align:center;">© 2026 AuraPass · aurapassticket.com</div>
      </td></tr>
    </table>
  </body>
</html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AuraPass <noreply@aurapassticket.com>",
      to: [data.organiserEmail],
      subject: `🎟️ New ticket sale — ${data.eventTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("[organiser-email] Failed to send:", err);
  } else {
    console.log("[organiser-email] Sent to:", data.organiserEmail);
  }
}

export async function sendAdminCancellationRequestEmail({
  eventTitle,
  reason,
}: {
  eventTitle: string;
  reason: string;
}) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.error("[cancel-request-email] RESEND_API_KEY not set");
    return;
  }

  const adminUrl = "https://aurapassticket.com/dashboard/admin";
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#111827">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB">
          <tr><td style="padding:20px 32px;background:#111827;color:#FFFFFF;font-size:20px;font-weight:700">
            <span>aura</span><span style="color:#D946EF">pass</span>
          </td></tr>
          <tr><td style="padding:28px 32px 8px">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">⚠️ Event Cancellation Request</h1>
            <p style="margin:0 0 20px;font-size:14px;color:#6B7280">An organiser has requested to cancel a published event.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:12px">
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6">Event</td>
                <td style="padding:12px 16px;font-size:13px;color:#111827;text-align:right;font-weight:600;border-bottom:1px solid #F3F4F6">${escapeHtml(eventTitle)}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6B7280;vertical-align:top">Reason</td>
                <td style="padding:12px 16px;font-size:13px;color:#111827;text-align:right;white-space:pre-wrap">${escapeHtml(reason)}</td>
              </tr>
            </table>
          </td></tr>
          <tr><td style="padding:24px 32px 32px;text-align:center">
            <a href="${adminUrl}" style="display:inline-block;background:#EF4444;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px">Review Request</a>
          </td></tr>
        </table>
        <div style="margin-top:16px;font-size:12px;color:#9CA3AF;text-align:center">© 2026 AuraPass · aurapassticket.com</div>
      </td></tr>
    </table>
  </body></html>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "AuraPass <noreply@aurapassticket.com>",
      to: ["support@aurapassticket.com"],
      subject: `⚠️ Cancellation request — ${eventTitle}`,
      html,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("[cancel-request-email] Failed:", err);
  }
}

