/**
 * usePublicEquipmentListings / useMyEquipmentListings — public directory reads
 * (active listings only, enforced by RLS) and the lister's own listings.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export interface EquipmentListing {
  id: string;
  lister_id: string;
  title: string;
  description: string | null;
  category: string | null;
  photo_urls: string[];
  rental_price: number;
  available_locations: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function usePublicEquipmentListings() {
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("equipment_listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (!active) return;
      setListings((data as EquipmentListing[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { listings, loading };
}

export function useMyEquipmentListings() {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("equipment_listings")
      .select("*")
      .eq("lister_id", user.id)
      .order("created_at", { ascending: false });
    setListings((data as EquipmentListing[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  return { listings, loading: loading || authLoading, refetch };
}

export function useEquipmentListing(id: string) {
  const [listing, setListing] = useState<EquipmentListing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("equipment_listings")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!active) return;
      setListing((data as EquipmentListing | null) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return { listing, loading };
}
