import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
  organiserId: string;
  size?: "sm" | "md";
}

export function FollowButton({ organiserId, size = "md" }: FollowButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isFollowing, followerCount, loading, toggleFollow } = useFollow(organiserId);

  function handleClick() {
    if (!user) {
      navigate({
        to: "/login",
        search: {
          redirect: typeof window !== "undefined" ? window.location.pathname : "/",
        },
      });
      return;
    }
    toggleFollow();
  }

  const sizeClasses = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all disabled:opacity-60 ${sizeClasses} ${
        isFollowing
          ? "border border-[#D946EF] bg-white text-[#D946EF] hover:bg-[#FDF4FF]"
          : "bg-[#D946EF] text-white hover:bg-[#C026D3]"
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="h-3.5 w-3.5" /> Following
        </>
      ) : (
        <>
          <UserPlus className="h-3.5 w-3.5" /> Follow
        </>
      )}
      {followerCount > 0 && (
        <span
          className={`ml-1 rounded-full px-1.5 py-0.5 text-xs ${
            isFollowing ? "bg-[#FDF4FF] text-[#D946EF]" : "bg-white/20 text-white"
          }`}
        >
          {followerCount}
        </span>
      )}
    </button>
  );
}
