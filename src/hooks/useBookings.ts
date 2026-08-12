/**
 * Booking hooks — artist inbox, organiser outbox and message threads.
 * All reads go straight through RLS-protected tables; all writes go through
 * the booking RPCs (respond_to_booking_request / send_booking_message /
 * finalize_booking).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { BookingMessage, BookingRequest } from "@/lib/bookings";

const EVENT_SELECT =
  "*, events:event_id(id,title,slug,city,venue,event_date,event_time,status)";

type Perspective = "artist" | "organiser";

export function useBookingRequests(perspective: Perspective) {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const column = perspective === "artist" ? "artist_id" : "organiser_id";
    const { data, error } = await (supabase as any)
      .from("booking_requests")
      .select(EVENT_SELECT)
      .eq(column, user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("[useBookingRequests]", error);
    const rows = ((data as BookingRequest[] | null) ?? []);
    setBookings(rows);
    setLoading(false);

    // Counterpart display names.
    const otherIds = Array.from(
      new Set(rows.map((b) => (perspective === "artist" ? b.organiser_id : b.artist_id))),
    );
    if (otherIds.length) {
      if (perspective === "artist") {
        const { data: profs } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, username")
          .in("id", otherIds);
        setNames(
          Object.fromEntries(
            ((profs as any[]) ?? []).map((p) => [p.id, p.full_name ?? p.username ?? "Organiser"]),
          ),
        );
      } else {
        const { data: artists } = await (supabase as any)
          .from("artist_profiles")
          .select("user_id, stage_name")
          .in("user_id", otherIds);
        setNames(
          Object.fromEntries(
            ((artists as any[]) ?? []).map((a) => [a.user_id, a.stage_name ?? "Artist"]),
          ),
        );
      }
    }
  }, [user, perspective]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  return { bookings, names, loading: loading || authLoading, refetch };
}

export function useBookingMessages(bookingId: string | null) {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!bookingId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("booking_messages")
      .select("*")
      .eq("booking_request_id", bookingId)
      .order("created_at", { ascending: true });
    if (error) console.error("[useBookingMessages]", error);
    setMessages(((data as BookingMessage[] | null) ?? []));
    setLoading(false);
  }, [bookingId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { messages, loading, refetch };
}
