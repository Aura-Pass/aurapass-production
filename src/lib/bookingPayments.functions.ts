import { createServerFn } from "@tanstack/react-start";

export const initializeBookingDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { bookingRequestId: string; callbackUrl: string }) => {
    if (
      !data ||
      typeof data.bookingRequestId !== "string" ||
      typeof data.callbackUrl !== "string"
    ) {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const { data: booking, error: bookingError } = await sb
      .from("booking_requests")
      .select("*")
      .eq("id", data.bookingRequestId)
      .single();

    if (bookingError || !booking) {
      return { error: "Booking request not found" as const };
    }
    if (booking.status !== "awaiting_deposit") {
      return { error: "This booking is not awaiting a deposit." as const };
    }
    if (booking.deposit_paid_at) {
      return { error: "Deposit has already been paid for this booking." as const };
    }
    if (!booking.deposit_amount || Number(booking.deposit_amount) <= 0) {
      return { error: "No deposit amount set for this booking." as const };
    }

    const { data: authResult } = await sb.auth.admin.getUserById(booking.organiser_id);
    const organiserEmail = authResult?.user?.email;
    if (!organiserEmail) {
      return { error: "Could not find organiser email for this booking." as const };
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
        email: organiserEmail,
        amount: Math.round(Number(booking.deposit_amount) * 100),
        callback_url: data.callbackUrl,
        metadata: { type: "booking_deposit", booking_request_id: booking.id },
      }),
    });

    const paystackData = (await paystackRes.json()) as any;
    if (!paystackData?.status) {
      return { error: "Could not initialize payment" as const };
    }

    await sb
      .from("booking_requests")
      .update({ paystack_reference: paystackData.data.reference })
      .eq("id", booking.id);

    return {
      authorizationUrl: paystackData.data.authorization_url as string,
      reference: paystackData.data.reference as string,
      bookingRequestId: booking.id as string,
    };
  });

export const verifyBookingDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { reference: string }) => {
    if (!data || typeof data.reference !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fulfilBookingDeposit, verifyWithPaystack } = await import("@/lib/fulfilment.server");
    const sb = supabaseAdmin as any;

    const verified = await verifyWithPaystack(data.reference);
    if (!verified.ok) {
      return { success: false as const, error: verified.error };
    }

    const result = await fulfilBookingDeposit(sb, {
      reference: data.reference,
      verifiedData: verified.data,
      amount: Number(verified.data?.amount ?? 0) / 100 || undefined,
    });
    if (!result.success) return { success: false as const, error: result.error };
    return { success: true as const, bookingRequestId: result.bookingRequestId };
  });

export const reconcileBookingDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: { bookingRequestId: string }) => {
    if (!data || typeof data.bookingRequestId !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fulfilBookingDeposit, verifyWithPaystack } = await import("@/lib/fulfilment.server");
    const sb = supabaseAdmin as any;

    const { data: booking } = await sb
      .from("booking_requests")
      .select("id, status, deposit_paid_at, paystack_reference")
      .eq("id", data.bookingRequestId)
      .maybeSingle();

    if (!booking) return { success: false as const, error: "Booking request not found" };

    if (booking.deposit_paid_at) {
      return { success: true as const, bookingRequestId: booking.id as string, fulfilledNow: false };
    }
    if (!booking.paystack_reference) {
      return { success: false as const, error: "No payment reference on this booking" };
    }

    const verified = await verifyWithPaystack(booking.paystack_reference);
    if (!verified.ok) return { success: false as const, error: verified.error };

    const result = await fulfilBookingDeposit(sb, {
      reference: booking.paystack_reference,
      verifiedData: verified.data,
      amount: Number(verified.data?.amount ?? 0) / 100 || undefined,
    });
    if (!result.success) return { success: false as const, error: result.error };
    return {
      success: true as const,
      bookingRequestId: result.bookingRequestId,
      fulfilledNow: result.fulfilledNow,
    };
  });

export const initializeBookingBalance = createServerFn({ method: "POST" })
  .inputValidator((data: { bookingRequestId: string; callbackUrl: string }) => {
    if (!data || typeof data.bookingRequestId !== "string" || typeof data.callbackUrl !== "string") {
      throw new Error("Invalid input");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;
    const { data: booking, error: bookingError } = await sb
      .from("booking_requests")
      .select("*")
      .eq("id", data.bookingRequestId)
      .single();
    if (bookingError || !booking) return { error: "Booking request not found" as const };
    if (booking.status !== "accepted" || !booking.deposit_paid_at) {
      return { error: "Deposit has not been paid yet." as const };
    }
    if (booking.balance_paid_at) return { error: "Balance has already been paid." as const };
    if (!booking.balance_amount || Number(booking.balance_amount) <= 0) {
      return { error: "No balance due on this booking." as const };
    }

    const { data: authResult } = await sb.auth.admin.getUserById(booking.organiser_id);
    const organiserEmail = authResult?.user?.email;
    if (!organiserEmail) return { error: "Could not find organiser email for this booking." as const };

    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) return { error: "Payment provider not configured" as const };

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: organiserEmail,
        amount: Math.round(Number(booking.balance_amount) * 100),
        callback_url: data.callbackUrl,
        metadata: { type: "booking_balance", booking_request_id: booking.id },
      }),
    });
    const paystackData = (await paystackRes.json()) as any;
    if (!paystackData?.status) return { error: "Could not initialize payment" as const };

    await sb
      .from("booking_requests")
      .update({ balance_paystack_reference: paystackData.data.reference })
      .eq("id", booking.id);

    return {
      authorizationUrl: paystackData.data.authorization_url as string,
      reference: paystackData.data.reference as string,
      bookingRequestId: booking.id as string,
    };
  });

export const verifyBookingBalance = createServerFn({ method: "POST" })
  .inputValidator((data: { reference: string }) => {
    if (!data || typeof data.reference !== "string") throw new Error("Invalid input");
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fulfilBookingBalance, verifyWithPaystack } = await import("@/lib/fulfilment.server");
    const verified = await verifyWithPaystack(data.reference);
    if (!verified.ok) return { success: false as const, error: verified.error };
    const result = await fulfilBookingBalance(supabaseAdmin as any, {
      reference: data.reference,
      verifiedData: verified.data,
      amount: Number(verified.data?.amount ?? 0) / 100 || undefined,
    });
    if (!result.success) return { success: false as const, error: result.error };
    return { success: true as const, bookingRequestId: result.bookingRequestId };
  });
