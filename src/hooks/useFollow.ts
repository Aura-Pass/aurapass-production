import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function useFollow(organiserId: string | undefined) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organiserId) return;
    let active = true;

    async function fetchFollowState() {
      const { count } = await (supabase as any)
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("organiser_id", organiserId);

      if (!active) return;
      setFollowerCount(count ?? 0);

      if (user) {
        const { data } = await (supabase as any)
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("organiser_id", organiserId)
          .maybeSingle();
        if (active) setIsFollowing(!!data);
      } else {
        setIsFollowing(false);
      }
      if (active) setLoading(false);
    }

    fetchFollowState();
    return () => {
      active = false;
    };
  }, [organiserId, user]);

  async function toggleFollow() {
    if (!user || !organiserId) return;

    if (isFollowing) {
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
      const { error } = await (supabase as any)
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("organiser_id", organiserId);
      if (error) {
        setIsFollowing(true);
        setFollowerCount((c) => c + 1);
      }
    } else {
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      const { error } = await (supabase as any)
        .from("follows")
        .insert({ follower_id: user.id, organiser_id: organiserId });
      if (error) {
        setIsFollowing(false);
        setFollowerCount((c) => Math.max(0, c - 1));
      }
    }
  }

  return { isFollowing, followerCount, loading, toggleFollow };
}
