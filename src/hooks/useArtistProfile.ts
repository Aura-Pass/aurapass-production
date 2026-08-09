/**
 * useMyArtistProfile — the signed-in user's own artist_profiles row (any status).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { ArtistProfile } from "@/lib/artists";

export function useMyArtistProfile() {
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setApplication(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("artist_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setApplication((data as ArtistProfile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  return { application, loading: loading || authLoading, refetch };
}
