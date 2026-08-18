/**
 * useAuth — global authentication hook (multi-role aware)
 *
 * Returns:
 *  - user         Supabase Auth user
 *  - profile      AuraPass profiles table row (profiles.role kept for legacy display only)
 *  - activeRoles  string[] of active roles from the user_roles table (source of truth)
 *  - hasRole(r)   convenience helper
 *  - refreshRoles() re-fetch activeRoles (used after "Become an Organiser")
 *
 * Roles are fetched via the get_user_roles(user_id) Postgres function and kept in a
 * tiny module-level store so every mounted consumer updates together — no page reload
 * is needed after a role is granted.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export type AppRole = "attendee" | "organiser" | "admin";

// ---- module-level roles store (shared across all useAuth consumers) ----
let rolesCache: string[] = [];
let rolesUserId: string | null = null;
const roleListeners = new Set<(roles: string[]) => void>();

function setRoles(userId: string | null, roles: string[]) {
  rolesUserId = userId;
  rolesCache = roles;
  roleListeners.forEach((fn) => fn(roles));
}

export async function fetchActiveRoles(userId: string): Promise<string[]> {
  try {
    const { data, error } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    }).rpc("get_user_roles", { _user_id: userId });

    if (!error && Array.isArray(data)) {
      const roles = (data as unknown[])
        .map((r) => (typeof r === "string" ? r : (r as { role?: string })?.role))
        .filter((r): r is string => typeof r === "string");
      return roles.length ? Array.from(new Set(roles)) : ["attendee"];
    }
  } catch (err) {
    console.error("[useAuth] get_user_roles failed", err);
  }

  // Fallback: read the table directly (active rows only)
  try {
    const { data } = await (supabase as any)
      .from("user_roles")
      .select("role, status")
      .eq("user_id", userId);
    const roles = ((data as Array<{ role: string; status?: string }> | null) ?? [])
      .filter((r) => !r.status || r.status === "active")
      .map((r) => r.role);
    return roles.length ? Array.from(new Set(roles)) : ["attendee"];
  } catch {
    return ["attendee"];
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRoles, setActiveRoles] = useState<string[]>(rolesCache);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const listener = (roles: string[]) => setActiveRoles(roles);
    roleListeners.add(listener);
    return () => {
      roleListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadUserData = async (userId: string) => {
      const [{ data }, roles] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        fetchActiveRoles(userId),
      ]);
      if (!active) return;
      setProfile((data as Profile | null) ?? null);
      setRoles(userId, roles);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid blocking the auth callback
          setTimeout(() => loadUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRoles(null, []);
          setLoading(false);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadUserData(session.user.id);
      else {
        setRoles(null, []);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    const id = user?.id ?? rolesUserId;
    if (!id) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, [user?.id]);

  const refreshRoles = useCallback(async () => {
    const id = user?.id ?? rolesUserId;
    if (!id) return [] as string[];
    const roles = await fetchActiveRoles(id);
    setRoles(id, roles);
    return roles;
  }, [user?.id]);

  const hasRole = useCallback(
    (role: string) => activeRoles.includes(role),
    [activeRoles],
  );

  async function signOut() {
    setRoles(null, []);
    await supabase.auth.signOut();
  }

  return {
    user,
    profile,
    activeRoles,
    hasRole,
    refreshRoles,
    refreshProfile,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
}
