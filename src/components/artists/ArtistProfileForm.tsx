/**
 * ArtistProfileForm — shared UI for applying to become an artist and for
 * editing an existing artist profile.
 *
 * Photos upload to the `artist-photos` bucket using the path convention
 * `{user_id}/{filename}` required by the storage RLS policies.
 * Status is NEVER set by the client: inserts rely on the table default and
 * status transitions go through the moderation RPCs.
 */
import { useRef, useState } from "react";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { CITIES } from "@/constants";
import {
import { CityMultiSelect } from "@/components/ui/CitySelect";
  GENRE_SUGGESTIONS,
  MAX_PHOTOS,
  MAX_VIDEOS,
  isSupportedVideoUrl,
  type ArtistProfile,
} from "@/lib/artists";

interface Props {
  existing?: ArtistProfile | null;
  /** "apply" inserts a new row, "edit" updates the existing one. */
  mode: "apply" | "edit";
  submitLabel?: string;
  onSaved: () => void | Promise<void>;
}

export function ArtistProfileForm({ existing, mode, submitLabel, onSaved }: Props) {
  const { user, profile } = useAuth();
  const [stageName, setStageName] = useState(existing?.stage_name ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [genres, setGenres] = useState<string[]>(existing?.genres ?? []);
  const [genreInput, setGenreInput] = useState("");
  const [rateInfo, setRateInfo] = useState(existing?.rate_info ?? "");
  const [locations, setLocations] = useState<string[]>(existing?.available_locations ?? []);
  const [estimatedRate, setEstimatedRate] = useState(
    existing?.estimated_rate != null ? String(existing.estimated_rate) : "",
  );
  const [spotifyUrl, setSpotifyUrl] = useState(existing?.spotify_url ?? "");
  const [appleMusicUrl, setAppleMusicUrl] = useState(existing?.apple_music_url ?? "");
  const [audiomackUrl, setAudiomackUrl] = useState(existing?.audiomack_url ?? "");
  const [photos, setPhotos] = useState<string[]>(existing?.photo_urls ?? []);
  const [videos, setVideos] = useState<string[]>(existing?.video_links ?? []);
  const [videoInput, setVideoInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function addGenre(value: string) {
    const g = value.trim();
    if (!g) return;
    if (genres.some((x) => x.toLowerCase() === g.toLowerCase())) return;
    setGenres((prev) => [...prev, g]);
    setGenreInput("");
  }

  function addVideo() {
    const url = videoInput.trim();
    if (!url) return;
    if (videos.length >= MAX_VIDEOS) {
      toast.error(`You can add up to ${MAX_VIDEOS} video links.`);
      return;
    }
    if (!isSupportedVideoUrl(url)) {
      toast.error("Only YouTube, Instagram or TikTok links are allowed.");
      return;
    }
    setVideos((prev) => [...prev, url]);
    setVideoInput("");
  }

  async function handleFiles(files: FileList) {
    if (!user) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`You can upload up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files).slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB.`);
        continue;
      }
      const ext = file.name.split(".").pop() ?? "jpg";
      // Path convention required by the artist-photos RLS policies.
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("artist-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error("[ArtistProfileForm] upload failed", error);
        toast.error(`Could not upload ${file.name}.`);
        continue;
      }
      const { data } = supabase.storage.from("artist-photos").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!stageName.trim()) {
      toast.error("Stage name is required.");
      return;
    }
    const rate = estimatedRate.trim() ? Number(estimatedRate) : null;
    if (rate !== null && (Number.isNaN(rate) || rate < 0)) {
      toast.error("Estimated rate must be a positive number.");
      return;
    }
    if (spotifyUrl.trim() && !isHostUrl(spotifyUrl, ["open.spotify.com", "spotify.com"])) {
      toast.error("Enter a valid Spotify link (open.spotify.com).");
      return;
    }
    if (appleMusicUrl.trim() && !isHostUrl(appleMusicUrl, ["music.apple.com"])) {
      toast.error("Enter a valid Apple Music link (music.apple.com).");
      return;
    }
    if (audiomackUrl.trim() && !isHostUrl(audiomackUrl, ["audiomack.com"])) {
      toast.error("Enter a valid Audiomack link (audiomack.com).");
      return;
    }
    setSubmitting(true);

    const payload = {
      stage_name: stageName.trim(),
      bio: bio.trim() || null,
      genres,
      rate_info: rateInfo.trim() || null,
      photo_urls: photos,
      video_links: videos,
      available_locations: locations,
      estimated_rate: rate,
      spotify_url: spotifyUrl.trim() || null,
      apple_music_url: appleMusicUrl.trim() || null,
      audiomack_url: audiomackUrl.trim() || null,
    };

    if (mode === "edit" && existing) {
      const { error } = await (supabase as any)
        .from("artist_profiles")
        .update(payload)
        .eq("id", existing.id);
      setSubmitting(false);
      if (error) {
        toast.error(error.message ?? "Could not save your profile.");
        return;
      }
      toast.success("Artist profile saved.");
      await onSaved();
      return;
    }

    // status intentionally omitted — the table default applies.
    const { error } = await (supabase as any)
      .from("artist_profiles")
      .insert({ ...payload, user_id: user.id });
    setSubmitting(false);

    if (error) {
      if (error.code === "23505") {
        toast.error("You already have an application — check its status below.");
        await onSaved();
        return;
      }
      toast.error(error.message ?? "Could not submit your application.");
      return;
    }

    toast.success("Application submitted for review.");
    await onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AvatarUpload
        value={profile?.avatar_url ?? null}
        initials={(stageName || profile?.username || "U").slice(0, 2).toUpperCase()}
      />

      <Field label="Stage name" required>

        <Input
          value={stageName}
          onChange={(e) => setStageName(e.target.value)}
          placeholder="e.g. DJ Aura"
          maxLength={80}
          required
        />
      </Field>

      <Field label="Bio">
        <Textarea
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell organisers about your sound, experience and past shows."
          maxLength={1500}
        />
      </Field>

      <Field label="Genres">
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Badge key={g} className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]">
              {g}
              <button
                type="button"
                onClick={() => setGenres((prev) => prev.filter((x) => x !== g))}
                className="ml-1"
                aria-label={`Remove ${g}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addGenre(genreInput);
              }
            }}
            placeholder="Add a genre and press Enter"
            maxLength={40}
          />
          <Button type="button" variant="outline" onClick={() => addGenre(genreInput)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {GENRE_SUGGESTIONS.filter(
            (g) => !genres.some((x) => x.toLowerCase() === g.toLowerCase()),
          ).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => addGenre(g)}
              className="rounded-full border border-[#E5E7EB] px-3 py-1 text-xs text-[#6B7280] hover:border-[#D946EF] hover:text-[#D946EF]"
            >
              + {g}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Rate info">
        <Input
          value={rateInfo}
          onChange={(e) => setRateInfo(e.target.value)}
          placeholder="e.g. ₦150,000 - ₦300,000 per set"
          maxLength={160}
        />
      </Field>

      <Field label="Available locations">
        <p className="mb-2 text-xs text-[#6B7280]">
          Organisers filter artists by where they can perform. Leave empty to appear everywhere.
        </p>
        <CityMultiSelect values={locations} onChange={setLocations} placeholder="Add a city" />
      </Field>

      <Field label="Estimated rate (₦)">
        <Input
          type="number"
          min="0"
          step="5000"
          value={estimatedRate}
          onChange={(e) => setEstimatedRate(e.target.value)}
          placeholder="e.g. 250000"
        />
        <p className="mt-1 text-xs text-[#6B7280]">
          Used for budget filtering and the "proceed at estimated price" booking option.
        </p>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Spotify URL">
          <Input
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/artist/…"
          />
        </Field>
        <Field label="Apple Music URL">
          <Input
            value={appleMusicUrl}
            onChange={(e) => setAppleMusicUrl(e.target.value)}
            placeholder="https://music.apple.com/…"
          />
        </Field>
        <Field label="Audiomack URL">
          <Input
            value={audiomackUrl}
            onChange={(e) => setAudiomackUrl(e.target.value)}
            placeholder="https://audiomack.com/…"
          />
        </Field>
      </div>

      <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((url) => (
            <div key={url} className="relative">
              <img src={url} alt="Artist" className="h-24 w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((prev) => prev.filter((p) => p !== url))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#6B7280] hover:border-[#D946EF] hover:bg-[#FDF4FF]"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#D946EF]" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? "Uploading" : "Add photo"}
            </button>
          ) : null}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void handleFiles(e.target.files);
          }}
        />
      </Field>

      <Field label={`Video links (${videos.length}/${MAX_VIDEOS})`}>
        <ul className="space-y-2">
          {videos.map((v) => (
            <li
              key={v}
              className="flex items-center justify-between gap-2 rounded-md border border-[#E5E7EB] px-3 py-2"
            >
              <span className="truncate text-sm text-[#374151]">{v}</span>
              <button
                type="button"
                onClick={() => setVideos((prev) => prev.filter((x) => x !== v))}
                aria-label="Remove video link"
              >
                <X className="h-4 w-4 text-[#6B7280]" />
              </button>
            </li>
          ))}
        </ul>
        {videos.length < MAX_VIDEOS ? (
          <div className="mt-2 flex gap-2">
            <Input
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVideo();
                }
              }}
              placeholder="YouTube, Instagram or TikTok link"
            />
            <Button type="button" variant="outline" onClick={addVideo}>
              Add
            </Button>
          </div>
        ) : null}
        <p className="mt-1 text-xs text-[#6B7280]">
          Only YouTube, Instagram and TikTok links are accepted.
        </p>
      </Field>

      <Button type="submit" variant="primary" disabled={submitting || uploading}>
        {submitting ? "Saving…" : (submitLabel ?? (mode === "apply" ? "Submit application" : "Save changes"))}
      </Button>
    </form>
  );
}

/** True when `raw` parses as an https URL on one of the allowed hosts. */
function isHostUrl(raw: string, hosts: string[]): boolean {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return hosts.includes(host);
  } catch {
    return false;
  }
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#111827]">
        {label}
        {required ? <span className="text-[#D946EF]"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
