import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Event } from "@/types";

export interface AdminEvent extends Omit<Event, "ticket_types"> {
  organiser_name: string;
  organiser_email?: string;
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
        `*, profiles!events_organiser_id_fkey ( full_name, email ), ticket_types ( id, name, price, quantity )`,
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      const mapped = (data as any[]).map((e) => ({
        ...e,
        organiser_name: e.profiles?.full_name ?? "Unknown",
        organiser_email: e.profiles?.email ?? "",
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
    rejectionReason?: string,
  ) {
    const patch: Record<string, unknown> = { status };
    if (status === "rejected") {
      patch.rejection_reason = rejectionReason ?? null;
    } else {
      patch.rejection_reason = null;
    }

    const { error } = await (supabase as any)
      .from("events")
      .update(patch)
      .eq("id", eventId);

    if (!error) {
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, status, rejection_reason: patch.rejection_reason as string | null }
            : e,
        ),
      );
    }
    return { error };
  }

  return { events, loading, updateEventStatus, refetch: fetchEvents };
}
