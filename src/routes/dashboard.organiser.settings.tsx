import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UsernameSettings } from "@/components/settings/UsernameSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { getBankList, verifyAndSaveBankAccount } from "@/lib/payouts.functions";

export const Route = createFileRoute("/dashboard/organiser/settings")({
  head: () => ({ meta: [{ title: "Settings | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserSettingsPage />
    </ProtectedRoute>
  ),
});

function OrganiserSettingsPage() {
  return (
    <>
      <div className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account and public profile.
            </p>
          </div>
          <OrganiserProfileSettings />
          <PayoutAccountSettings />
          <UsernameSettings />
        </div>
      </div>
    </>
  );
}

function OrganiserProfileSettings() {
  const { profile } = useAuth();
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(profile?.twitter_url ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Profile updated.");
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Public Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This information appears on your public profile at{" "}
          <span className="font-medium text-brand-hover break-all">
            aurapassticket.com/organisers/@{profile?.username ?? "yourname"}
          </span>
        </p>
      </div>

      <AvatarUpload
        value={profile?.avatar_url ?? null}
        initials={(profile?.username ?? profile?.full_name ?? "U")
          .slice(0, 2)
          .toUpperCase()}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell attendees about yourself and the events you run..."
          maxLength={300}
          rows={3}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground-light">{bio.length}/300</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Website
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Instagram
        </label>
        <input
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Twitter / X
        </label>
        <input
          type="url"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          placeholder="https://twitter.com/yourhandle"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {message && <p className="text-sm text-success-strong">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </Card>
  );
}
