/**
 * EquipmentListerProfileForm — shared UI for applying to become an equipment
 * lister and for editing an existing equipment lister profile.
 *
 * Photos upload to the `equipment-photos` bucket using the path convention
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
import { CityMultiSelect } from "@/components/ui/CitySelect";
import {
  EQUIPMENT_CATEGORY_SUGGESTIONS,
  MAX_PHOTOS,
  MAX_VIDEOS,
  isSupportedVideoUrl,
  type EquipmentListerProfile,
} from "@/lib/equipment";

interface Props {
  existing?: EquipmentListerProfile | null;
  /** "apply" inserts a new row, "edit" updates the existing one. */
  mode: "apply" | "edit";
  submitLabel?: string;
  onSaved: () => void | Promise<void>;
}

export function EquipmentListerProfileForm({ existing, mode, submitLabel, onSaved }: Props) {
  const { user, profile } = useAuth();
  const [businessName, setBusinessName] = useState(existing?.business_name ?? "");
  const [bio, setBio] = useState(existing?.bio ?? "");
  const [categories, setCategories] = useState<string[]>(existing?.equipment_categories ?? []);
  const [categoryInput, setCategoryInput] = useState("");
  const [locations, setLocations] = useState<string[]>(existing?.available_locations ?? []);
  const [photos, setPhotos] = useState<string[]>(existing?.photo_urls ?? []);
  const [videos, setVideos] = useState<string[]>(existing?.video_links ?? []);
  const [videoInput, setVideoInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function addCategory(value: string) {
    const c = value.trim();
    if (!c) return;
    if (categories.some((x) => x.toLowerCase() === c.toLowerCase())) return;
    setCategories((prev) => [...prev, c]);
    setCategoryInput("");
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
      // Path convention required by the equipment-photos RLS policies.
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("equipment-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error("[EquipmentListerProfileForm] upload failed", error);
        toast.error(`Could not upload ${file.name}.`);
        continue;
      }
      const { data } = supabase.storage.from("equipment-photos").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setPhotos((prev) => [...prev, ...uploaded]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!businessName.trim()) {
      toast.error("Business name is required.");
      return;
    }
    setSubmitting(true);

    const payload = {
      business_name: businessName.trim(),
      bio: bio.trim() || null,
      equipment_categories: categories,
      photo_urls: photos,
      video_links: videos,
      available_locations: locations,
    };

    if (mode === "edit" && existing) {
      const { error } = await (supabase as any)
        .from("equipment_lister_profiles")
        .update(payload)
        .eq("id", existing.id);
      setSubmitting(false);
      if (error) {
        toast.error(error.message ?? "Could not save your profile.");
        return;
      }
      toast.success("Equipment lister profile saved.");
      await onSaved();
      return;
    }

    // status intentionally omitted — the table default applies.
    const { error } = await (supabase as any)
      .from("equipment_lister_profiles")
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
        initials={(businessName || profile?.username || "U").slice(0, 2).toUpperCase()}
      />

      <Field label="Business name" required>
        <Input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="e.g. Aura Sound Rentals"
          maxLength={80}
          required
        />
      </Field>

      <Field label="Bio">
        <Textarea
          rows={5}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell organisers about your gear, experience and past events."
          maxLength={1500}
        />
      </Field>

      <Field label="Equipment categories">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c} className="bg-brand-tint text-brand-hover hover:bg-brand-tint">
              {c}
              <button
                type="button"
                onClick={() => setCategories((prev) => prev.filter((x) => x !== c))}
                className="ml-1"
                aria-label={`Remove ${c}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <Input
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCategory(categoryInput);
              }
            }}
            placeholder="Add a category and press Enter"
            maxLength={40}
          />
          <Button type="button" variant="outline" onClick={() => addCategory(categoryInput)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {EQUIPMENT_CATEGORY_SUGGESTIONS.filter(
            (c) => !categories.some((x) => x.toLowerCase() === c.toLowerCase()),
          ).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => addCategory(c)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
            >
              + {c}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Available locations">
        <p className="mb-2 text-xs text-muted-foreground">
          Organisers filter listers by where they can deliver. Leave empty to appear everywhere.
        </p>
        <CityMultiSelect values={locations} onChange={setLocations} placeholder="Add a city" />
      </Field>

      <Field label={`Photos (${photos.length}/${MAX_PHOTOS})`}>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {photos.map((url) => (
            <div key={url} className="relative">
              <img src={url} alt="Equipment" className="h-24 w-full rounded-lg object-cover" />
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
              className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted text-xs text-muted-foreground hover:border-primary hover:bg-brand-tint"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
              className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
            >
              <span className="truncate text-sm text-foreground-secondary">{v}</span>
              <button
                type="button"
                onClick={() => setVideos((prev) => prev.filter((x) => x !== v))}
                aria-label="Remove video link"
              >
                <X className="h-4 w-4 text-muted-foreground" />
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
        <p className="mt-1 text-xs text-muted-foreground">
          Only YouTube, Instagram and TikTok links are accepted.
        </p>
      </Field>

      <Button type="submit" variant="primary" disabled={submitting || uploading}>
        {submitting
          ? "Saving…"
          : (submitLabel ?? (mode === "apply" ? "Submit application" : "Save changes"))}
      </Button>
    </form>
  );
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
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required ? <span className="text-primary"> *</span> : null}
      </label>
      {children}
    </div>
  );
}
