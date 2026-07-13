/**
 * useAuth — global authentication hook
 * Returns: user (Supabase Auth user), profile (AuraPass profiles table row), loading, signOut
 * Usage: const { user, profile, loading, signOut } = useAuth();
 */
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchProfile = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          // Defer to avoid blocking the auth callback
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { user, profile, loading, signOut, isAuthenticated: !!user };
}
