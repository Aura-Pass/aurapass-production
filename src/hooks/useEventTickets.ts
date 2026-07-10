import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface EventTicket {
  id: string;
  qr_code: string;
  status: "valid" | "used" | "voided";
  checked_in_at: string | null;
  order: {
    buyer_name: string;
    buyer_email: string;
    quantity: number;
  };
  ticket_type: {
    name: string;
  };
}

export function useEventTickets(eventId: string | undefined) {
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!eventId) return;
    const { data, error } = await (supabase as any)
      .from("tickets")
      .select(
        `id, qr_code, status, checked_in_at,
         orders!inner ( buyer_name, buyer_email, quantity ),
         ticket_types ( name )`,
      )
      .eq("event_id", eventId)
      .order("checked_in_at", { ascending: false, nullsFirst: false });

    if (!error && data) {
      setTickets(
        (data as any[]).map((t) => ({
          id: t.id,
          qr_code: t.qr_code,
          status: t.status,
          checked_in_at: t.checked_in_at,
          order: t.orders,
          ticket_type: t.ticket_types,
        })),
      );
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, refetch: fetchTickets };
}
