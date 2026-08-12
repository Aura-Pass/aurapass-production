/**
 * Booking domain helpers (Phase 2, part 1 — no payments).
 *
 * Backend contract (verified against the live schema):
 *  - table  booking_requests(id, event_id, artist_id /* auth user id of the artist *\/,
 *                            organiser_id, mode, requested_price, final_price,
 *                            deposit_amount, deposit_paid_at, status,
 *                            responded_at, created_at, updated_at)
 *  - table  booking_messages(id, booking_request_id, sender_id, message,
 *                            proposed_price, created_at)
 *  - rpc    respond_to_booking_request(_booking_request_id, _decision 'accept'|'decline')
 *  - rpc    send_booking_message(_booking_request_id, _message, _proposed_price)
 *  - rpc    finalize_booking(_booking_request_id, _final_price)
 */

export type BookingMode = "direct" | "negotiate";

export type BookingStatus =
  | "pending_event_approval"
  | "awaiting_artist_response"
  | "negotiating"
  | "awaiting_deposit"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface BookingRequest {
  id: string;
  event_id: string;
  /** auth.users id of the artist (NOT artist_profiles.id) */
  artist_id: string;
  organiser_id: string;
  mode: BookingMode;
  requested_price: number | null;
  final_price: number | null;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  status: BookingStatus;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  /** joined */
  events?: {
    id: string;
    title: string;
    slug: string | null;
    city: string;
    venue: string;
    event_date: string;
    event_time: string;
    status: string;
  } | null;
}

export interface BookingMessage {
  id: string;
  booking_request_id: string;
  sender_id: string;
  message: string;
  proposed_price: number | null;
  created_at: string;
}

export const BOOKING_STATUS_LABEL: Record<string, string> = {
  pending_event_approval: "Awaiting event approval",
  awaiting_artist_response: "Awaiting artist response",
  negotiating: "Negotiating",
  awaiting_deposit: "Awaiting deposit",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function bookingStatusClasses(status: string): string {
  switch (status) {
    case "accepted":
      return "bg-[#ECFDF5] text-[#047857]";
    case "declined":
    case "cancelled":
    case "expired":
      return "bg-[#FEE2E2] text-[#B91C1C]";
    case "awaiting_deposit":
      return "bg-[#EFF6FF] text-[#1D4ED8]";
    case "negotiating":
      return "bg-[#FDF4FF] text-[#A21CAF]";
    default:
      return "bg-[#FFFBEB] text-[#B45309]";
  }
}

export function formatNaira(value: number | null | undefined): string {
  if (value === null || value === undefined) return "Contact for pricing";
  return `₦${Number(value).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Local queue for opening notes written before the booking becomes messageable. */
const DRAFT_PREFIX = "aurapass:booking-draft:";

export function saveBookingDraft(bookingId: string, message: string) {
  if (typeof window === "undefined" || !message.trim()) return;
  window.localStorage.setItem(DRAFT_PREFIX + bookingId, message.trim());
}

export function readBookingDraft(bookingId: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DRAFT_PREFIX + bookingId);
}

export function clearBookingDraft(bookingId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DRAFT_PREFIX + bookingId);
}
