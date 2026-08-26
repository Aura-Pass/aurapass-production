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
      <h2 className="text-lg font-semibold text-foreground">Username</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Letters, numbers, and underscores only. This is how others will see you.
      </p>
      {!profile?.username && (
        <p className="mt-4 text-sm text-muted-foreground bg-brand-tint border border-primary/20 rounded-lg px-4 py-3">
          You haven't set a username yet. Choose one below to personalise your AuraPass profile.
        </p>
      )}
      <div className="relative mt-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground-light">
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
          className="w-full rounded-lg border border-border px-4 py-3 pl-8 text-sm text-foreground placeholder:text-muted-foreground-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {error ? (
        <p className="mt-3 rounded-md border border-destructive-strong bg-destructive-light px-3 py-2 text-sm text-destructive-strong">
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
