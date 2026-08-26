/**
 * AvatarUpload — reusable circular profile photo picker.
 *
 * Uploads to the `profile-photos` bucket using the `{user_id}/{filename}`
 * path convention required by the storage RLS policies, then writes the
 * resulting public URL to profiles.avatar_url.
 */
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  /** Current avatar URL, if any. */
  value?: string | null;
  /** Fallback initials when no photo is set. */
  initials?: string;
  /** Called with the new public URL after a successful upload + save. */
  onUploaded?: (url: string) => void;
  size?: number;
  className?: string;
}

export function AvatarUpload({
  value,
  initials = "U",
  onUploaded,
  size = 96,
  className = "",
}: Props) {
  const { user, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = preview ?? value ?? null;

  async function handleFile(file: File) {
    if (!user) return;
    setError(null);

    if (!ACCEPTED.includes(file.type.toLowerCase())) {
      setError("Please choose a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is larger than 5MB. Please choose a smaller file.");
      return;
    }

    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("[AvatarUpload] upload failed", uploadError);
      setUploading(false);
      setError(uploadError.message || "Upload failed. Please try again.");
      return;
    }

    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setUploading(false);
    if (updateError) {
      setError(updateError.message || "Could not save your photo.");
      return;
    }

    setPreview(publicUrl);
    onUploaded?.(publicUrl);
    await refreshProfile?.();
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || !user}
        aria-label="Change profile photo"
        className="group relative flex-shrink-0 overflow-hidden rounded-full bg-brand-tint focus:outline-none focus:ring-2 focus:ring-primary"
        style={{ height: size, width: size }}
      >
        {current ? (
          <img
            src={current}
            alt="Profile photo"
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand-hover">
            {initials}
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </span>
        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        ) : null}
      </button>

      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">Profile photo</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          JPG, PNG or WEBP. Max 5MB.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !user}
          className="mt-2 text-sm font-semibold text-brand-hover hover:underline disabled:opacity-60"
        >
          {uploading ? "Uploading..." : current ? "Change photo" : "Upload photo"}
        </button>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
