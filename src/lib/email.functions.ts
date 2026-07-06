import { createServerFn } from "@tanstack/react-start";

interface TicketConfirmationInput {
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

export const sendTicketConfirmationEmail = createServerFn({ method: "POST" })
  .inputValidator((data: TicketConfirmationInput) => {
    if (
      !data ||
      typeof data.to !== "string" ||
      typeof data.buyerName !== "string" ||
      typeof data.eventTitle !== "string" ||
      typeof data.orderId !== "string"
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
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
            <tr>
              <td style="padding:24px 32px 8px;text-align:center;">
                <a href="${confirmationUrl}" style="display:inline-block;background:#111827;color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:600;font-size:15px;">
                  View My Tickets &amp; QR Codes
                </a>
                <p style="margin:12px 0 0;font-size:12px;color:#6B7280;">Show your QR code at the gate for entry</p>
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

    return { success: true as const };
  });

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
