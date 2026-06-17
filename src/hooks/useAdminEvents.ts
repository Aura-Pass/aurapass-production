import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types";

export interface AdminEvent extends Event {
  organiser_name: string;
  ticket_types: { id: string; name: string; price: number; quantity: number }[];
}

export function useAdminEvents() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("events")
      .select(
        `*, profiles!events_organiser_id_fkey ( full_name ), ticket_types ( id, name, price, quantity )`,
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      const mapped = (data as any[]).map((e) => ({
        ...e,
        organiser_name: e.profiles?.full_name ?? "Unknown",
        ticket_types: e.ticket_types ?? [],
      })) as AdminEvent[];
      setEvents(mapped);
    } else {
      setEvents([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  async function updateEventStatus(
    eventId: string,
    status: "published" | "rejected",
  ) {
    const { error } = await (supabase as any)
      .from("events")
      .update({ status })
      .eq("id", eventId);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status } : e)),
      );
    }
    return { error };
  }

  return { events, loading, updateEventStatus, refetch: fetchEvents };
}
