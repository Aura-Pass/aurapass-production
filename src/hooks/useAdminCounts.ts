import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface AdminCounts {
  pendingEvents: number;
  cancellations: number;
  artistApplications: number;
  equipmentApplications: number;
  fundRequests: number;
}

const EMPTY: AdminCounts = {
  pendingEvents: 0,
  cancellations: 0,
  artistApplications: 0,
  equipmentApplications: 0,
  fundRequests: 0,
};

/** Real counts of admin items awaiting action, read with the existing admin queries. */
export function useAdminCounts(enabled = true) {
  const [counts, setCounts] = useState<AdminCounts>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    (async () => {
      const db = supabase as any;
      const head = { count: "exact", head: true } as const;
      const [ev, cancel, artist, equip, funds] = await Promise.all([
        db.from("events").select("id", head).eq("status", "pending_review"),
        db.from("events").select("id", head).eq("cancellation_status", "requested"),
        db.from("artist_profiles").select("id", head).eq("status", "pending_review"),
        db.from("equipment_lister_profiles").select("id", head).eq("status", "pending_review"),
        db.rpc("get_admin_fund_requests", { p_status: "pending" }),
      ]);
      if (!active) return;
      setCounts({
        pendingEvents: ev.count ?? 0,
        cancellations: cancel.count ?? 0,
        artistApplications: artist.count ?? 0,
        equipmentApplications: equip.count ?? 0,
        fundRequests: Array.isArray(funds.data) ? funds.data.length : 0,
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [enabled]);

  return { counts, loading };
}
