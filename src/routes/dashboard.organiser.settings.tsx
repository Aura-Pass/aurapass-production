import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UsernameSettings } from "@/components/settings/UsernameSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";

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
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage your account and public profile.
            </p>
          </div>
          <OrganiserProfileSettings />
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
        <h2 className="text-lg font-semibold text-[#111827]">Public Profile</h2>
        <p className="mt-1 text-sm text-[#6B7280]">
          This information appears on your public profile at{" "}
          <span className="font-medium text-[#A21CAF] break-all">
            aurapassticket.com/organisers/@{profile?.username ?? "yourname"}
          </span>
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#111827]">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell attendees about yourself and the events you run..."
          maxLength={300}
          rows={3}
          className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#D946EF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]/20 resize-none"
        />
        <p className="mt-1 text-xs text-[#9CA3AF]">{bio.length}/300</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#111827]">
          Website
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#D946EF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#111827]">
          Instagram
        </label>
        <input
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
          className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#D946EF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-[#111827]">
          Twitter / X
        </label>
        <input
          type="url"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          placeholder="https://twitter.com/yourhandle"
          className="w-full rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm focus:border-[#D946EF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]/20"
        />
      </div>

      {message && <p className="text-sm text-[#059669]">{message}</p>}
      {error && <p className="text-sm text-[#DC2626]">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-[#D946EF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C026D3] disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </Card>
  );
}
