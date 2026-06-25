import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MyTicket {
  id: string;
  qr_code: string;
  status: "valid" | "used" | "voided";
  checked_in_at: string | null;
  order: {
    id: string;
    buyer_name: string;
    quantity: number;
    total_amount: number;
    created_at: string;
  };
  event: {
    id: string;
    title: string;
    banner_url: string | null;
    venue: string;
    city: string;
    event_date: string;
    event_time: string;
  };
  ticket_type: {
    name: string;
    price: number;
  };
}

export function useMyTickets(userEmail: string | undefined) {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchTickets() {
      const { data, error } = await (supabase as any)
        .from("tickets")
        .select(`
          id, qr_code, status, checked_in_at, created_at,
          orders!inner ( id, buyer_name, buyer_email, quantity, total_amount, created_at ),
          events ( id, title, banner_url, venue, city, event_date, event_time ),
          ticket_types ( name, price )
        `)
        .eq("orders.buyer_email", userEmail)
        .order("created_at", { ascending: false });

      if (active) {
        if (error || !data) {
          setTickets([]);
        } else {
          const mapped = data.map((t: any) => ({
            id: t.id,
            qr_code: t.qr_code,
            status: t.status,
            checked_in_at: t.checked_in_at,
            order: t.orders,
            event: t.events,
            ticket_type: t.ticket_types,
          }));
          setTickets(mapped);
        }
        setLoading(false);
      }
    }

    fetchTickets();
    return () => { active = false; };
  }, [userEmail]);

  return { tickets, loading };
}
