/**
 * Server functions for third-party media metadata (TikTok oEmbed thumbnails).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const cache = new Map<string, string | null>();

export const getTikTokThumbnail = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ url: z.string().url() }).parse(data))
  .handler(async ({ data }) => {
    if (cache.has(data.url)) return { thumbnail: cache.get(data.url) ?? null };
    let thumbnail: string | null = null;
    try {
      const res = await fetch(
        `https://www.tiktok.com/oembed?url=${encodeURIComponent(data.url)}`,
      );
      if (res.ok) {
        const json = (await res.json()) as { thumbnail_url?: string };
        thumbnail = json.thumbnail_url ?? null;
      }
    } catch {
      thumbnail = null;
    }
    cache.set(data.url, thumbnail);
    return { thumbnail };
  });
