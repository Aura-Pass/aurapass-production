import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Upload, X } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB.");
      return;
    }

    setUploading(true);
    const fileExt = file.name.split(".").pop() ?? "jpg";
    const fileName = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("event-banners")
      .upload(fileName, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      console.error("[ImageUpload] upload failed", uploadError);
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("event-banners").getPublicUrl(fileName);
    onChange(data.publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleRemove() {
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onChange("");
  }

  return (
    <div className="space-y-2">
      {value && value.trim() !== "" ? (
        <div className="relative">
          <img
            src={value}
            alt="Event banner"
            className="h-48 w-full rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280] transition-colors hover:border-[#D946EF] hover:bg-[#FDF4FF] disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#D946EF]" />
          ) : (
            <Upload className="h-6 w-6" />
          )}
          <span className="text-sm font-medium">
            {uploading ? "Uploading..." : "Click to upload event banner"}
          </span>
          <span className="text-xs">PNG or JPG, up to 5MB</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      {error ? <p className="text-sm text-[#B91C1C]">{error}</p> : null}
    </div>
  );
}
