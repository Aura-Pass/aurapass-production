/**
 * payouts.functions.ts
 *
 * Paystack-verified organiser payout bank account management.
 * Pattern matches payments.functions.ts (supabaseAdmin via dynamic import,
 * PAYSTACK_SECRET_KEY from env).
 */
import { createServerFn } from "@tanstack/react-start";

export const getBankList = createServerFn({ method: "GET" }).handler(async () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("Payment provider not configured");
  const res = await fetch("https://api.paystack.co/bank?country=nigeria&currency=NGN", {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = (await res.json()) as any;
  if (!data?.status) throw new Error("Could not load bank list");
  return (data.data as any[]).map((b) => ({ name: b.name as string, code: b.code as string }));
});

export const verifyAndSaveBankAccount = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { organiserId: string; accountNumber: string; bankCode: string; bankName: string }) => {
      if (
        !d ||
        typeof d.organiserId !== "string" ||
        typeof d.accountNumber !== "string" ||
        !/^\d{10}$/.test(d.accountNumber) ||
        typeof d.bankCode !== "string" ||
        typeof d.bankName !== "string"
      ) {
        throw new Error("Invalid input");
      }
      return d;
    },
  )
  .handler(
    async ({
      data,
    }): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> => {
      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) return { ok: false, error: "Payment provider not configured" };

      let resolveData: any;
      try {
        const resolveRes = await fetch(
          `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(
            data.accountNumber,
          )}&bank_code=${encodeURIComponent(data.bankCode)}`,
          { headers: { Authorization: `Bearer ${secret}` } },
        );
        resolveData = await resolveRes.json();
      } catch {
        return { ok: false, error: "Could not reach the bank verification service. Try again." };
      }

      if (!resolveData?.status || !resolveData?.data?.account_name) {
        const raw = String(resolveData?.message ?? "");
        const friendly = /could not resolve account name/i.test(raw)
          ? "We couldn't verify this account. Make sure the 10-digit account number matches the selected bank. (Account verification only works with a live Paystack key.)"
          : raw || "Could not verify this account number. Double-check the details and try again.";
        return { ok: false, error: friendly };
      }

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const sb = supabaseAdmin as any;

      const { error } = await sb.from("organiser_bank_accounts").upsert(
        {
          organiser_id: data.organiserId,
          bank_name: data.bankName,
          bank_code: data.bankCode,
          account_number: data.accountNumber,
          account_name: resolveData.data.account_name,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organiser_id" },
      );

      if (error) return { ok: false, error: error.message };

      return { ok: true, accountName: resolveData.data.account_name as string };
    },
  );

export const notifyAdminFundRequest = createServerFn({ method: "POST" })
  .inputValidator(
    (d: {
      eventTitle: string;
      organiserName: string;
      organiserUsername: string;
      amountRequested: number;
      isFinalSettlement: boolean;
      fundRequestId: string;
    }) => {
      if (
        !d ||
        typeof d.eventTitle !== "string" ||
        typeof d.organiserName !== "string" ||
        typeof d.organiserUsername !== "string" ||
        typeof d.amountRequested !== "number" ||
        typeof d.isFinalSettlement !== "boolean" ||
        typeof d.fundRequestId !== "string"
      ) {
        throw new Error("Invalid input");
      }
      return d;
    },
  )
  .handler(async ({ data }) => {
    const { sendAdminFundRequestEmail } = await import("@/lib/email.server");
    await sendAdminFundRequestEmail(data);
    return { sent: true };
  });
