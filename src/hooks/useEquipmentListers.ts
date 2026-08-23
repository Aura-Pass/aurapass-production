/**
 * usePublicEquipmentListerProfiles / useEquipmentListerProfile — public directory
 * reads (approved lister profiles only, enforced by RLS).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { EquipmentListerProfile } from "@/lib/equipment";
import type { EquipmentListing } from "@/hooks/useEquipmentListings";

export function usePublicEquipmentListerProfiles() {
  const [listers, setListers] = useState<EquipmentListerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("equipment_lister_profiles")
        .select("*")
        .eq("status", "approved")
        .order("business_name", { ascending: true });
      if (!active) return;
      setListers((data as EquipmentListerProfile[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { listers, loading };
}

export function useEquipmentListerProfile(id: string) {
  const [lister, setLister] = useState<EquipmentListerProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("equipment_lister_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      const row = (data as EquipmentListerProfile | null) ?? null;
      setLister(row);
      setLoading(false);
      if (row?.user_id) {
        const { data: prof } = await (supabase as any)
          .from("profiles")
          .select("avatar_url")
          .eq("id", row.user_id)
          .maybeSingle();
        if (!active) return;
        setAvatarUrl((prof?.avatar_url as string | null) ?? null);

        const { data: rows } = await (supabase as any)
          .from("equipment_listings")
          .select("*")
          .eq("lister_id", row.user_id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (!active) return;
        setListings((rows as EquipmentListing[] | null) ?? []);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return { lister, avatarUrl, listings, loading };
}
