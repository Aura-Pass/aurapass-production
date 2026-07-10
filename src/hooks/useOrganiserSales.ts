import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface SaleRecord {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  ticketTypeName: string;
  ticketTypeId: string;
  quantitySold: number;
  revenue: number;
  eventStatus: string;
}

export function useOrganiserSales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    async function fetch() {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(
          `quantity,
           ticket_price,
           ticket_types ( id, name ),
           events!inner ( id, title, event_date, status, organiser_id )`,
        )
        .eq("status", "confirmed")
        .eq("events.organiser_id", user!.id);

      if (active && !error && data) {
        setSales(
          (data as any[]).map((o) => ({
            eventId: o.events.id,
            eventTitle: o.events.title,
            eventDate: o.events.event_date,
            eventStatus: o.events.status,
            ticketTypeName: o.ticket_types?.name ?? "Ticket",
            ticketTypeId: o.ticket_types?.id ?? "",
            quantitySold: Number(o.quantity) || 0,
            revenue: Number(o.ticket_price ?? 0) * Number(o.quantity ?? 0),
          })),
        );
      }
      if (active) setLoading(false);
    }

    fetch();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return { sales, loading };
}
