/**
 * Paystack webhook — charge.success
 *
 * Public endpoint (no site auth). Every request is authenticated by verifying
 * the HMAC-SHA512 signature Paystack sends in `x-paystack-signature`, computed
 * over the raw request body with the account's secret key.
 *
 * Configure in the Paystack dashboard (Settings → API Keys & Webhooks):
 *   https://aurapassticket.com/api/public/paystack-webhook
 *
 * Fulfilment is idempotent, so redelivered events are harmless.
 */
import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYSTACK_SECRET_KEY"];
        if (!secret) return new Response("Not configured", { status: 500 });

        const raw = await request.text();
        const signature = request.headers.get("x-paystack-signature") ?? "";
        const expected = createHmac("sha512", secret).update(raw).digest("hex");

        const sigBuf = Buffer.from(signature, "utf8");
        const expBuf = Buffer.from(expected, "utf8");
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          console.warn("[paystack-webhook] invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try {
          payload = JSON.parse(raw);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const event = String(payload?.event ?? "");
        const reference = payload?.data?.reference;

        if (event !== "charge.success" || typeof reference !== "string") {
          // Acknowledge everything else so Paystack stops retrying.
          return new Response("ignored", { status: 200 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const metadataType = payload?.data?.metadata?.type;

          if (metadataType === "booking_deposit") {
            const { fulfilBookingDeposit } = await import("@/lib/fulfilment.server");
            const result = await fulfilBookingDeposit(supabaseAdmin as any, {
              reference,
              verifiedData: payload.data,
              amount: Number(payload?.data?.amount ?? 0) / 100 || undefined,
            });
            console.log("[paystack-webhook] booking deposit charge.success", reference, result);
          } else if (metadataType === "booking_balance") {
            const { fulfilBookingBalance } = await import("@/lib/fulfilment.server");
            const result = await fulfilBookingBalance(supabaseAdmin as any, {
              reference,
              verifiedData: payload.data,
              amount: Number(payload?.data?.amount ?? 0) / 100 || undefined,
            });
            console.log("[paystack-webhook] booking balance charge.success", reference, result);
          } else if (metadataType === "equipment_booking_deposit") {
            const { fulfilEquipmentBookingDeposit } = await import("@/lib/fulfilment.server");
            const result = await fulfilEquipmentBookingDeposit(supabaseAdmin as any, {
              reference,
              verifiedData: payload.data,
              amount: Number(payload?.data?.amount ?? 0) / 100 || undefined,
            });
            console.log(
              "[paystack-webhook] equipment booking deposit charge.success",
              reference,
              result,
            );
          } else if (metadataType === "equipment_booking_balance") {
            const { fulfilEquipmentBookingBalance } = await import("@/lib/fulfilment.server");
            const result = await fulfilEquipmentBookingBalance(supabaseAdmin as any, {
              reference,
              verifiedData: payload.data,
              amount: Number(payload?.data?.amount ?? 0) / 100 || undefined,
            });
            console.log(
              "[paystack-webhook] equipment booking balance charge.success",
              reference,
              result,
            );
          } else {
            const { fulfilPaidOrder } = await import("@/lib/fulfilment.server");
            const result = await fulfilPaidOrder(supabaseAdmin as any, {
              reference,
              verifiedData: payload.data,
              amount: Number(payload?.data?.amount ?? 0) / 100 || undefined,
            });
            console.log("[paystack-webhook] charge.success", reference, result);
          }
        } catch (err) {
          console.error("[paystack-webhook] fulfilment error", reference, err);
          return new Response("Fulfilment error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
