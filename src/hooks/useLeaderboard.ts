import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PartyMonsterEntry, CrowdControlEntry } from "@/types";

export function useLeaderboard() {
  const [partyMonster, setPartyMonster] = useState<PartyMonsterEntry[]>([]);
  const [crowdControl, setCrowdControl] = useState<CrowdControlEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchLeaderboards() {
      const [pmRes, ccRes] = await Promise.all([
        (supabase.from("party_monster_leaderboard" as never) as never as { select: (s: string) => Promise<{ data: unknown[] | null }> }).select("*"),
        (supabase.from("crowd_control_leaderboard" as never) as never as { select: (s: string) => Promise<{ data: unknown[] | null }> }).select("*"),
      ]);

      if (!active) return;
      setPartyMonster(
        ((pmRes.data ?? []) as PartyMonsterEntry[]).map((e, i) => ({ ...e, rank: i + 1 })),
      );
      setCrowdControl(
        ((ccRes.data ?? []) as CrowdControlEntry[]).map((e, i) => ({ ...e, rank: i + 1 })),
      );
      setLoading(false);
    }

    fetchLeaderboards();
    return () => {
      active = false;
    };
  }, []);

  return { partyMonster, crowdControl, loading };
}
