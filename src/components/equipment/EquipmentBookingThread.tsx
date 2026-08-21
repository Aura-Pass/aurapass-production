/**
 * EquipmentBookingThread — negotiation thread + payment actions for a single
 * equipment booking request. Mirrors BookingThread; the requester (organiser)
 * pays the deposit and balance.
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
import {
  useEquipmentBookingMessages,
  type EquipmentBookingRequest,
} from "@/hooks/useEquipmentBookings";
import {
  initializeEquipmentBookingBalance,
  initializeEquipmentBookingDeposit,
  reconcileEquipmentBookingDeposit,
} from "@/lib/equipmentBookingPayments.functions";
import { formatNaira } from "@/lib/bookings";

interface Props {
  booking: EquipmentBookingRequest;
  counterpartName: string;
  onChanged: () => void | Promise<void>;
}

const OPEN_STATUSES = ["awaiting_lister_response", "negotiating"];

export function EquipmentBookingThread({ booking, counterpartName, onChanged }: Props) {
  const { user } = useAuth();
  const { messages, loading, refetch } = useEquipmentBookingMessages(booking.id);
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [finalising, setFinalising] = useState<number | null>(null);
  const initDeposit = useServerFn(initializeEquipmentBookingDeposit);
  const reconcileDeposit = useServerFn(reconcileEquipmentBookingDeposit);
  const [payingDeposit, setPayingDeposit] = useState(false);
  const initBalance = useServerFn(initializeEquipmentBookingBalance);
  const [payingBalance, setPayingBalance] = useState(false);

  const isLister = user?.id === booking.lister_id;
  const awaitingDeposit = booking.status === "awaiting_deposit" && !booking.deposit_paid_at;
  const balanceDue =
    booking.status === "accepted" &&
    !!booking.deposit_paid_at &&
    !booking.balance_paid_at &&
    Number(booking.balance_amount ?? 0) > 0;

  useEffect(() => {
    if (!awaitingDeposit || !booking.paystack_reference) return;
    let active = true;
    (async () => {
      const result = await reconcileDeposit({
        data: { equipmentBookingRequestId: booking.id },
      });
      if (active && result.success && result.fulfilledNow) {
        await onChanged();
      }
    })();
    return () => {
      active = false;
    };
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
    const { error } = await (supabase as any).rpc("send_equipment_booking_message", {
      _equipment_booking_request_id: booking.id,
      _message: text.trim(),
      _proposed_price: proposed,
    });
    setSending(false);
    if (error) {
      toast.error(error.message ?? "Could not send message.");
      return;
    }
    setText("");
    setPrice("");
    await refetch();
    await onChanged();
  }

  async function finalise(amount: number) {
    setFinalising(amount);
    const { error } = await (supabase as any).rpc("finalize_equipment_booking", {
      _equipment_booking_request_id: booking.id,
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
        equipmentBookingRequestId: booking.id,
        callbackUrl: `${window.location.origin}/equipment-payment-callback`,
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
        equipmentBookingRequestId: booking.id,
        callbackUrl: `${window.location.origin}/equipment-balance-callback`,
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
                    mine
                      ? "bg-[#D946EF] text-white"
                      : "bg-white text-[#374151] border border-[#E5E7EB]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.message}</p>
                  {m.proposed_price !== null ? (
                    <p
                      className={`mt-1 text-xs font-semibold ${mine ? "text-white/90" : "text-[#A21CAF]"}`}
                    >
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

      {!isLister && awaitingDeposit ? (
        <div className="mt-4 rounded-lg border border-[#F5D0FE] bg-[#FDF4FF] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Deposit due: {formatNaira(booking.deposit_amount)}
              </p>
              <p className="text-xs text-[#6B7280]">
                Pay the deposit to confirm this booking and unlock the lister's contact details.
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

      {!isLister && balanceDue ? (
        <div className="mt-4 rounded-lg border border-[#F5D0FE] bg-[#FDF4FF] px-3 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Balance due: {formatNaira(booking.balance_amount)}
              </p>
              <p className="text-xs text-[#6B7280]">
                Pay the remaining balance to complete this booking.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={payingBalance}
              onClick={payBalance}
            >
              {payingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Pay Remaining Balance"
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
