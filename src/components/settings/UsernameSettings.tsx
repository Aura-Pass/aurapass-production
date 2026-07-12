import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export function UsernameSettings() {
  const { profile } = useAuth();
  const [username, setUsername] = useState(profile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setMessage(null);
    setError(null);
    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setError("Letters, numbers, and underscores only.");
      return;
    }
    if (!profile?.id) return;
    setSaving(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username: username.trim() })
      .eq("id", profile.id);
    setSaving(false);
    if (updateError) {
      setError(
        updateError.message.toLowerCase().includes("unique") ||
          updateError.message.toLowerCase().includes("duplicate")
          ? "That username is already taken. Please choose another."
          : updateError.message,
      );
    } else {
      setMessage("Username updated successfully.");
    }
  }

  return (
    <Card className="p-6" style={{ borderRadius: 12 }}>
      <h2 className="text-lg font-semibold text-[#111827]">Username</h2>
      <p className="mt-1 text-sm text-[#6B7280]">
        Letters, numbers, and underscores only. This is how others will see you.
      </p>
      {!profile?.username && (
        <p className="mt-4 text-sm text-[#6B7280] bg-[#FDF4FF] border border-[#D946EF]/20 rounded-lg px-4 py-3">
          You haven't set a username yet. Choose one below to personalise your AuraPass profile.
        </p>
      )}
      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9CA3AF]">
          @
        </span>
        <input
          type="text"
          value={username}
          onChange={(e) =>
            setUsername(
              e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
            )
          }
          placeholder="yourname"
          maxLength={30}
          className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 pl-8 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#D946EF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]/20"
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-md border border-[#86EFAC] bg-[#F0FDF4] px-3 py-2 text-sm text-[#166534]">
          {message}
        </p>
      ) : null}
      <div className="mt-4">
        <Button onClick={handleSave} variant="primary" loading={saving}>
          {saving ? "Saving..." : "Save Username"}
        </Button>
      </div>
    </Card>
  );
}
