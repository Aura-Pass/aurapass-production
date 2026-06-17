import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types";

export function useOrganiserEvents(organiserId: string | undefined) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!organiserId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    async function fetchEvents() {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organiser_id", organiserId)
        .order("created_at", { ascending: false });

      if (active) {
        setEvents(error ? [] : ((data as Event[] | null) ?? []));
        setLoading(false);
      }
    }

    fetchEvents();
    return () => {
      active = false;
    };
  }, [organiserId, refreshKey]);

  return { events, loading, refresh: () => setRefreshKey((k) => k + 1) };
}
