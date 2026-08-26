/**
 * EquipmentListingForm — create/edit a single equipment listing.
 *
 * Photos upload to the `equipment-photos` bucket using the path convention
 * `{user_id}/{filename}` required by the storage RLS policies.
 * `lister_id` is always taken from the signed-in user on create and never editable.
 */
import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { CityMultiSelect } from "@/components/ui/CitySelect";
import { MAX_PHOTOS } from "@/lib/equipment";
import type { EquipmentListing } from "@/hooks/useEquipmentListings";

interface Props {
  existing?: EquipmentListing | null;
  mode: "create" | "edit";
  onSaved: () => void | Promise<void>;
}

export function EquipmentListingForm({ existing, mode, onSaved }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [price, setPrice] = useState(
    existing?.rental_price != null ? String(existing.rental_price) : "",
  );
  const [locations, setLocations] = useState<string[]>(existing?.available_locations ?? []);
  const [photos, setPhotos] = useState<string[]>(existing?.photo_urls ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("equipment-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        console.error("[EquipmentListingForm] upload failed", error);
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
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const rental = Number(price);
    if (!price.trim() || Number.isNaN(rental) || rental < 0) {
      toast.error("Enter a valid rental price.");
      return;
    }
    setSubmitting(true);

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      rental_price: rental,
      photo_urls: photos,
      available_locations: locations,
    };

    if (mode === "edit" && existing) {
      const { error } = await (supabase as any)
        .from("equipment_listings")
        .update(payload)
        .eq("id", existing.id);
      setSubmitting(false);
      if (error) {
        toast.error(error.message ?? "Could not save this listing.");
        return;
      }
      toast.success("Listing saved.");
      await onSaved();
      return;
    }

    const { error } = await (supabase as any)
      .from("equipment_listings")
      .insert({ ...payload, lister_id: user.id });
    setSubmitting(false);
    if (error) {
      toast.error(error.message ?? "Could not create this listing.");
      return;
    }
    toast.success("Listing created.");
    await onSaved();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Field label="Title" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 4kW Line Array Sound System"
          maxLength={120}
          required
        />
      </Field>

      <Field label="Description">
        <Textarea
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's included, setup requirements, delivery notes…"
          maxLength={1500}
        />
      </Field>

      <Field label="Category">
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Sound System"
          maxLength={40}
        />
      </Field>

      <Field label="Rental price (₦)" required>
        <Input
          type="number"
          min={0}
          step="1"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 150000"
          required
        />
      </Field>

      <Field label="Available locations">
        <p className="mb-2 text-xs text-muted-foreground">
          Organisers filter by where you can deliver. Leave empty to appear everywhere.
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

      <Button type="submit" variant="primary" disabled={submitting || uploading}>
        {submitting ? "Saving…" : mode === "create" ? "Create listing" : "Save changes"}
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
