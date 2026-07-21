import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface FollowedOrganiser {
  id: string;
  full_name: string;
  username: string | null;
  avatar_url: string | null;
  upcomingEventCount: number;
}

export function useFollowedOrganisers() {
  const { user } = useAuth();
  const [organisers, setOrganisers] = useState<FollowedOrganiser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setOrganisers([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);

    (async () => {
      const today = new Date().toISOString().split("T")[0];

      const { data } = await (supabase as any)
        .from("follows")
        .select(
          `organiser_id, profiles!follows_organiser_id_fkey ( id, full_name, username, avatar_url )`,
        )
        .eq("follower_id", user.id);

      if (!active || !data) {
        if (active) {
          setOrganisers([]);
          setLoading(false);
        }
        return;
      }

      const result: FollowedOrganiser[] = await Promise.all(
        data.map(async (row: any) => {
          const profile = row.profiles;
          const { count } = await (supabase as any)
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("organiser_id", profile.id)
            .eq("status", "published")
            .gte("event_date", today);

          return {
            id: profile.id,
            full_name: profile.full_name,
            username: profile.username,
            avatar_url: profile.avatar_url,
            upcomingEventCount: count ?? 0,
          };
        }),
      );

      if (active) {
        setOrganisers(result);
        setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  return { organisers, loading };
}
