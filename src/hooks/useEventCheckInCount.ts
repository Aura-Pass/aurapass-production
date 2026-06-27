import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useEventCheckInCount(eventId: string | undefined, refreshKey = 0) {
  const [counts, setCounts] = useState({ checkedIn: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    async function fetchCounts() {
      const { count: total, error: totalError } = await (supabase as any)
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId as string);

      if (totalError) {
        console.error("[scanner] check-in total count failed:", totalError);
      }

      const { count: checkedIn, error: checkedInError } = await (supabase as any)
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId as string)
        .eq("status", "used");

      if (checkedInError) {
        console.error("[scanner] checked-in count failed:", checkedInError);
      }

      if (active) {
        setCounts({ checkedIn: checkedIn ?? 0, total: total ?? 0 });
        setLoading(false);
      }
    }

    fetchCounts();
    return () => {
      active = false;
    };
  }, [eventId, refreshKey]);

  return { ...counts, loading };
}
