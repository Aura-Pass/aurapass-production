/**
 * BookingThread — negotiation message thread for a single booking request.
 *
 * Writes go through the RPCs: send_booking_message + finalize_booking.
 * A "Book at ₦X" action appears next to the most recent price proposed by
 * the other party, which finalises the booking at that figure
 * (status -> awaiting_deposit; payment is Part 2).
 */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useBookingMessages } from "@/hooks/useBookings";
import {
  initializeBookingBalance,
  initializeBookingDeposit,
  reconcileBookingDeposit,
} from "@/lib/bookingPayments.functions";
import {
  clearBookingDraft,
  formatNaira,
  readBookingDraft,
  type BookingRequest,
} from "@/lib/bookings";

interface Props {
  booking: BookingRequest;
  counterpartName: string;
  onChanged: () => void | Promise<void>;
}

const OPEN_STATUSES = ["awaiting_artist_response", "negotiating", "pending_event_approval"];

export function BookingThread({ booking, counterpartName, onChanged }: Props) {
  const { user } = useAuth();
  const { messages, loading, refetch } = useBookingMessages(booking.id);
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [finalising, setFinalising] = useState<number | null>(null);
  const initDeposit = useServerFn(initializeBookingDeposit);
  const reconcileDeposit = useServerFn(reconcileBookingDeposit);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const initBalance = useServerFn(initializeBookingBalance);
  const [payingBalance, setPayingBalance] = useState(false);

  const isOrganiser = user?.id === booking.organiser_id;
  const awaitingDeposit = booking.status === "awaiting_deposit" && !booking.deposit_paid_at;
  const balanceDue =
    booking.status === "accepted" &&
    !!booking.deposit_paid_at &&
    !booking.balance_paid_at &&
    Number(booking.balance_amount ?? 0) > 0;

  // Pull in any note queued at event-creation time (before the thread existed).
  useEffect(() => {
    const draft = readBookingDraft(booking.id);
    if (draft) setText((t) => t || draft);
  }, [booking.id]);

  // Self-healing: if a payment reference exists but deposit_paid_at is still null,
  // silently check whether the webhook already fulfilled it (same pattern as
  // reconcileOrder on the order-confirmation page).
  useEffect(() => {
    if (!awaitingDeposit || !booking.paystack_reference) return;
    let active = true;
    (async () => {
      const result = await reconcileDeposit({ data: { bookingRequestId: booking.id } });
      if (active && result.success && result.fulfilledNow) {
        await onChanged();
      }
    })();
    return () => { active = false; };
  }, [booking.id, awaitingDeposit]);

  const canMessage = OPEN_STATUSES.includes(booking.status);

  async function send() {
    if (!text.trim()) {
      toast.error("Write a message first.");
      return;
    }
    const proposed = price.trim() ? Number(price) : null;
    if (proposed !== null && (Number.isNaN(proposed) || proposed < 0)) {
      toast.error("Proposed price must be a positive number.");
      return;
    }
    setSending(true);
    const { error } = await (supabase as any).rpc("send_booking_message", {
      _booking_request_id: booking.id,
      _message: text.trim(),
      _proposed_price: proposed,
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Could not send message.");
      return;
    }
    clearBookingDraft(booking.id);
    setText("");
    setPrice("");
    await refetch();
    await onChanged();
  }

  async function finalise(amount: number) {
    setFinalising(amount);
    const { error } = await (supabase as any).rpc("finalize_booking", {
      _booking_request_id: booking.id,
      _final_price: amount,
    });
    setFinalising(null);
    if (error) {
      toast.error(error.message ?? "Could not finalise the booking.");
      return;
    }
    toast.success(`Booked at ${formatNaira(amount)} — awaiting deposit.`);
    await refetch();
    await onChanged();
  }

  async function payDeposit() {
    setPayingDeposit(true);
    const result = await initDeposit({
      data: {
        bookingRequestId: booking.id,
        callbackUrl: `${window.location.origin}/booking-payment-callback`,
      },
    });
    setPayingDeposit(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.authorizationUrl;
  }

  async function payBalance() {
    setPayingBalance(true);
    const result = await initBalance({
      data: {
        bookingRequestId: booking.id,
        callbackUrl: `${window.location.origin}/booking-balance-callback`,
      },
    });
    setPayingBalance(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.authorizationUrl;
  }


  const lastCounterpartOffer = [...messages]
    .reverse()
    .find((m) => m.sender_id !== user?.id && m.proposed_price !== null);

  return (
    <div className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
      <h4 className="text-sm font-semibold text-[#111827]">Messages</h4>

      {loading ? (
        <p className="mt-3 text-sm text-[#6B7280]">Loading conversation…</p>
      ) : messages.length === 0 ? (
        <p className="mt-3 text-sm text-[#6B7280]">No messages yet.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <li key={m.id} className={mine ? "text-right" : "text-left"}>
                <div
                  className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    mine ? "bg-[#D946EF] text-white" : "bg-white text-[#374151] border border-[#E5E7EB]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  {m.proposed_price !== null ? (
                    <p className={`mt-1 text-xs font-semibold ${mine ? "text-white/90" : "text-[#A21CAF]"}`}>
                      Proposed: {formatNaira(m.proposed_price)}
                    </p>
                  ) : null}
                </div>
                <p className="mt-1 text-[11px] text-[#9CA3AF]">
                  {mine ? "You" : counterpartName} ·{" "}
                  {new Date(m.created_at).toLocaleString("en-NG")}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {lastCounterpartOffer && canMessage ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-[#F5D0FE] bg-[#FDF4FF] px-3 py-2">
          <span className="text-sm text-[#A21CAF]">
            {counterpartName} proposed {formatNaira(lastCounterpartOffer.proposed_price)}
          </span>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={finalising !== null}
            onClick={() => finalise(Number(lastCounterpartOffer.proposed_price))}
          >
            {finalising !== null ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Book at ${formatNaira(lastCounterpartOffer.proposed_price)}`
            )}
          </Button>
        </div>
      ) : null}

      {isOrganiser && awaitingDeposit ? (
        <div className="mt-4 rounded-lg border border-[#F5D0FE] bg-[#FDF4FF] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Deposit due: {formatNaira(booking.deposit_amount)}
              </p>
              <p className="text-xs text-[#6B7280]">
                Pay the deposit to confirm this booking and unlock the artist's contact details.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={payingDeposit}
              onClick={payDeposit}
            >
              {payingDeposit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Pay Deposit — ${formatNaira(booking.deposit_amount)}`
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {canMessage ? (
        <div className="mt-4 space-y-2">
          <Textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            maxLength={1000}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Propose a price (₦, optional)"
              className="max-w-[240px]"
            />
            <Button type="button" variant="primary" size="sm" onClick={send} disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2">Send</span>
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#6B7280]">
          This conversation is closed for new messages.
        </p>
      )}
    </div>
  );
}
