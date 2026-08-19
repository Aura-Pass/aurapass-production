/**
 * useMyEquipmentListerProfile — the signed-in user's own equipment_lister_profiles
 * row (any status).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { EquipmentListerProfile } from "@/lib/equipment";

export function useMyEquipmentListerProfile() {
  const { user, loading: authLoading } = useAuth();
  const [application, setApplication] = useState<EquipmentListerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!user) {
      setApplication(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("equipment_lister_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setApplication((data as EquipmentListerProfile | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    void refetch();
  }, [authLoading, refetch]);

  return { application, loading: loading || authLoading, refetch };
}
