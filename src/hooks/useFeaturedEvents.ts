import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PublishedEvent } from "@/hooks/usePublishedEvents";

/**
 * Homepage "Featured Events" as curated by an admin (featured_events table,
 * ordered by position). Only published, not-cancelled, not-yet-ended events are
 * returned (same 12-hour grace rule as usePublishedEvents). An empty result means
 * nothing is curated (or everything curated has ended) so callers can fall back.
 */
export function useFeaturedEvents() {
  const [events, setEvents] = useState<PublishedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("featured_events")
        .select("position, events!inner(*, ticket_types (*))")
        .eq("events.status", "published")
        .order("position", { ascending: true });

      if (!active) return;
      if (error) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const rows = ((data as any[]) ?? [])
        .map((r) => (Array.isArray(r.events) ? r.events[0] : r.events) as PublishedEvent | null)
        .filter((e): e is PublishedEvent => {
          if (!e || !e.event_date || (e as any).cancelled_at) return false;
          const start = new Date(`${e.event_date}T${e.event_time ?? "00:00:00"}`);
          return start > cutoff;
        });
      setEvents(rows);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { events, loading };
}
