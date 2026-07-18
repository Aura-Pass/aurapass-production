import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event, TicketType } from "@/types";

export interface PublishedEvent extends Event {
  ticket_types: TicketType[];
}

/**
 * Fetches published events that are still "active" — i.e. the event start
 * time has not passed by more than 12 hours. Past events are filtered out
 * client-side because Supabase can't easily combine `event_date` and
 * `event_time` in a server filter.
 */
export function usePublishedEvents(limit?: number, includePast = false) {
  const [events, setEvents] = useState<PublishedEvent[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    let active = true;

    async function fetchEvents() {
      let query = (supabase as any)
        .from("events")
        .select(`*, ticket_types (*)`)
        .eq("status", "published")
        .order("event_date", { ascending: includePast ? false : true });

      if (!includePast) {
        // Pre-filter server-side by date >= yesterday, exact 12h cutoff below.
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
        query = query.gte("event_date", yesterday);
      }

      if (limit) query = query.limit(includePast ? limit : limit * 2);

      const { data, error } = await query;

      if (!active) return;

      if (error) {
        setEvents([]);
        setLoading(false);
        return;
      }

      let result = (data as PublishedEvent[]) ?? [];
      if (!includePast) {
        const cutoffTime = new Date(Date.now() - 12 * 60 * 60 * 1000);
        result = result.filter((e) => {
          if (!e.event_date) return false;
          const eventStart = new Date(`${e.event_date}T${e.event_time ?? "00:00:00"}`);
          return eventStart > cutoffTime;
        });
      }

      setEvents(limit ? result.slice(0, limit) : result);
      setLoading(false);
    }

    fetchEvents();
    return () => {
      active = false;
    };
  }, [limit, includePast]);


  return { events, loading };
}
