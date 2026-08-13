/**
 * Artist domain helpers — shared types, video-link validation and embed URLs.
 * Phase 1: profiles only (no bookings).
 */

export type ArtistStatus = "pending_review" | "approved" | "rejected";

export interface ArtistProfile {
  id: string;
  user_id: string;
  stage_name: string;
  bio: string | null;
  genres: string[];
  rate_info: string | null;
  photo_urls: string[];
  video_links: string[];
  status: ArtistStatus;
  /** Cities the artist is willing to perform in (Phase 2 booking engine). */
  available_locations: string[] | null;
  estimated_rate: number | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  audiomack_url: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

export const GENRE_SUGGESTIONS = [
  "Afrobeats",
  "Amapiano",
  "Hip-Hop",
  "Gospel",
  "R&B",
  "Alté",
  "Fuji",
  "Highlife",
  "Reggae/Dancehall",
  "House",
  "Jazz",
  "DJ Set",
];

export const MAX_PHOTOS = 6;
export const MAX_VIDEOS = 3;

export type VideoPlatform = "youtube" | "instagram" | "tiktok";

/** Returns the platform for a supported video URL, or null when unsupported. */
export function detectVideoPlatform(rawUrl: string): VideoPlatform | null {
  let host: string;
  try {
    host = new URL(rawUrl.trim()).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") return "youtube";
  if (host === "instagram.com" || host === "instagr.am") return "instagram";
  if (host === "tiktok.com" || host === "vm.tiktok.com") return "tiktok";
  return null;
}

export function isSupportedVideoUrl(rawUrl: string): boolean {
  return detectVideoPlatform(rawUrl) !== null;
}

/** Extracts the YouTube video id from a supported watch/short/embed URL. */
export function getYouTubeId(rawUrl: string): string | null {
  if (detectVideoPlatform(rawUrl) !== "youtube") return null;
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  if (url.hostname.includes("youtu.be")) return url.pathname.slice(1) || null;
  const fromQuery = url.searchParams.get("v");
  if (fromQuery) return fromQuery;
  const parts = url.pathname.split("/");
  if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
    return parts[2] || null;
  }
  return null;
}

/** YouTube thumbnail URL, or null for non-YouTube links. */
export function youtubeThumbnailUrl(rawUrl: string): string | null {
  const id = getYouTubeId(rawUrl);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Converts a supported watch/post URL into an embeddable iframe src. */
export function toEmbedUrl(rawUrl: string): string | null {
  const platform = detectVideoPlatform(rawUrl);
  if (!platform) return null;

  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }

  if (platform === "youtube") {
    const id =
      url.hostname.includes("youtu.be")
        ? url.pathname.slice(1)
        : url.searchParams.get("v") ??
          (url.pathname.startsWith("/shorts/") ? url.pathname.split("/")[2] : null) ??
          (url.pathname.startsWith("/embed/") ? url.pathname.split("/")[2] : null);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (platform === "instagram") {
    const clean = `${url.origin}${url.pathname.replace(/\/$/, "")}`;
    return `${clean}/embed`;
  }

  // TikTok
  const match = url.pathname.match(/\/video\/(\d+)/);
  return match ? `https://www.tiktok.com/embed/v2/${match[1]}` : null;
}
