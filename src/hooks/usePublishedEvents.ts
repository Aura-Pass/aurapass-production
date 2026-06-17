import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event, TicketType } from "@/types";

export interface PublishedEvent extends Event {
  ticket_types: TicketType[];
}

export function usePublishedEvents(limit?: number) {
  const [events, setEvents] = useState<PublishedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      let query = (supabase as any)
        .from("events")
        .select(`*, ticket_types (*)`)
        .eq("status", "published")
        .order("event_date", { ascending: true });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (active) {
        setEvents(error ? [] : ((data as PublishedEvent[]) ?? []));
        setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      active = false;
    };
  }, [limit]);

  return { events, loading };
}
