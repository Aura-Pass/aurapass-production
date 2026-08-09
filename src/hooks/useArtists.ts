/**
 * usePublicArtists / useArtist — public directory reads (approved profiles only,
 * enforced by RLS).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ArtistProfile } from "@/lib/artists";

export function usePublicArtists() {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("artist_profiles")
        .select("*")
        .eq("status", "approved")
        .order("stage_name", { ascending: true });
      if (!active) return;
      setArtists(((data as ArtistProfile[] | null) ?? []));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { artists, loading };
}

export function useArtist(id: string) {
  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("artist_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      setArtist((data as ArtistProfile | null) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return { artist, loading };
}
