/**
 * Equipment lister domain helpers — shared types and category suggestions.
 * Video-link validation is re-used from the artist module (generic host check).
 */
export { isSupportedVideoUrl } from "@/lib/artists";

export const EQUIPMENT_CATEGORY_SUGGESTIONS = [
  "Sound System",
  "DJ Equipment",
  "Lighting",
  "Stage & Rigging",
  "Generators",
  "LED Screens",
  "Tents & Seating",
  "Photobooth",
];

export const MAX_PHOTOS = 6;
export const MAX_VIDEOS = 3;

export interface EquipmentListerProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio: string | null;
  equipment_categories: string[];
  photo_urls: string[];
  video_links: string[];
  available_locations: string[];
  status: "pending_review" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipmentListerStatus = EquipmentListerProfile["status"];
