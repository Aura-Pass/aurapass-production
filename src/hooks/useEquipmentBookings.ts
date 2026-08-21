/**
 * Equipment booking hooks — lister inbox, requester outbox and message threads.
 * Reads go through RLS-protected tables; messages come from the
 * get_equipment_booking_messages RPC.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type EquipmentBookingMode = "direct" | "negotiate";

export interface EquipmentBookingRequest {
  id: string;
  listing_id: string;
  lister_id: string;
  requester_id: string;
  mode: EquipmentBookingMode;
  status: string;
  requested_price: number | null;
  final_price: number | null;
  deposit_percentage: number | null;
  deposit_amount: number | null;
  deposit_paid_at: string | null;
  paystack_reference: string | null;
  balance_amount: number | null;
  balance_paid_at: string | null;
  balance_paystack_reference: string | null;
  event_name: string | null;
  event_date: string | null;
  venue: string | null;
  event_type: string | null;
  expected_attendance: number | null;
  created_at: string;
  updated_at: string;
  responded_at: string | null;
  /** joined */
  equipment_listings?: {
    id: string;
    title: string;
    photo_urls: string[] | null;
    category: string | null;
    rental_price: number | null;
  } | null;
}

export interface EquipmentBookingMessage {
  id: string;
  equipment_booking_request_id: string;
  sender_id: string;
  message: string;
  proposed_price: number | null;
  is_system?: boolean | null;
  contains_contact_info?: boolean | null;
  created_at: string;
}

const LISTING_SELECT =
  "*, equipment_listings:listing_id(id,title,photo_urls,category,rental_price)";

export function useEquipmentBookingRequests(perspective: "lister" | "requester") {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<EquipmentBookingRequest[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const column = perspective === "lister" ? "lister_id" : "requester_id";
    const { data, error } = await (supabase as any)
      .from("equipment_booking_requests")
      .select(LISTING_SELECT)
      .eq(column, user.id)
      .order("updated_at", { ascending: false });

    if (error) console.error("[useEquipmentBookingRequests]", error);
    const rows = ((data as EquipmentBookingRequest[] | null) ?? []);
    setBookings(rows);
    setLoading(false);

    const otherIds = Array.from(
      new Set(rows.map((b) => (perspective === "lister" ? b.requester_id : b.lister_id))),
    );
    if (otherIds.length) {
      const { data: profs } = await (supabase as any)
        .from("profiles")
        .select("id, full_name, username")
        .in("id", otherIds);
      setNames(
        Object.fromEntries(
          ((profs as any[]) ?? []).map((p) => [
            p.id,
            p.username ?? p.full_name ?? (perspective === "lister" ? "Organiser" : "Lister"),
          ]),
        ),
      );
    }
  }, [user, perspective]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  return { bookings, names, loading: loading || authLoading, refetch };
}

export function useEquipmentBookingMessages(equipmentBookingRequestId: string | null) {
  const [messages, setMessages] = useState<EquipmentBookingMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    if (!equipmentBookingRequestId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_equipment_booking_messages", {
      p_equipment_booking_request_id: equipmentBookingRequestId,
    });
    if (error) console.error("[useEquipmentBookingMessages]", error);
    setMessages(((data as EquipmentBookingMessage[] | null) ?? []));
    setLoading(false);
  }, [equipmentBookingRequestId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { messages, loading, refetch };
}
