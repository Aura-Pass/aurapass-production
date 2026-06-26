import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface OrganiserStats {
  ticketsSold: number;
  revenue: number;
}

export function useOrganiserStats(organiserId: string | undefined) {
  const [stats, setStats] = useState<OrganiserStats>({ ticketsSold: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organiserId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function fetchStats() {
      // Get organiser's event ids
      const { data: events } = await (supabase as any)
        .from("events")
        .select("id")
        .eq("organiser_id", organiserId as string);

      const ids = (events ?? []).map((e: any) => e.id);
      if (ids.length === 0) {
        if (active) {
          setStats({ ticketsSold: 0, revenue: 0 });
          setLoading(false);
        }
        return;
      }

      const { data: orders } = await (supabase as any)
        .from("orders")
        .select("quantity, ticket_price, status, event_id")
        .in("event_id", ids)
        .eq("status", "confirmed");

      const ticketsSold = (orders ?? []).reduce(
        (sum: number, o: any) => sum + (Number(o.quantity) || 0),
        0,
      );
      const revenue = (orders ?? []).reduce(
        (sum: number, o: any) => sum + Number(o.ticket_price ?? 0) * Number(o.quantity ?? 0),
        0,
      );

      if (active) {
        setStats({ ticketsSold, revenue });
        setLoading(false);
      }
    }

    fetchStats();
    return () => {
      active = false;
    };
  }, [organiserId]);

  return { ...stats, loading };
}
