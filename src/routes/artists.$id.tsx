/**
 * Public artist profile — gallery, embedded videos, genres and rate info.
 */
import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2, Play } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MediaLightbox, type MediaItem } from "@/components/ui/MediaLightbox";
import { useArtist } from "@/hooks/useArtists";
import { detectVideoPlatform, toEmbedUrl, youtubeThumbnailUrl } from "@/lib/artists";
import { getTikTokThumbnail } from "@/lib/media.functions";


export const Route = createFileRoute("/artists/$id")({
  head: () => ({
    meta: [
      { title: "Artist Profile | AuraPass" },
      {
        name: "description",
        content:
          "See photos, performance videos, genres and booking rates for this AuraPass artist.",
      },
      { property: "og:title", content: "Artist Profile | AuraPass" },
      {
        property: "og:description",
        content: "Photos, videos, genres and rates for this AuraPass artist.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArtistProfilePage,
});

function ArtistProfilePage() {
  const { id } = Route.useParams();
  const { artist, loading } = useArtist(id);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [tiktokThumbs, setTiktokThumbs] = useState<Record<string, string>>({});

  const tiktokLinks = (artist?.video_links ?? []).filter(
    (raw) => detectVideoPlatform(raw) === "tiktok",
  );
  const tiktokKey = tiktokLinks.join("|");

  useEffect(() => {
    let active = true;
    if (!tiktokKey) return;
    void (async () => {
      const entries = await Promise.all(
        tiktokKey.split("|").map(async (url) => {
          try {
            const res = await getTikTokThumbnail({ data: { url } });
            return [url, res.thumbnail] as const;
          } catch {
            return [url, null] as const;
          }
        }),
      );
      if (!active) return;
      setTiktokThumbs(
        Object.fromEntries(entries.filter((e): e is readonly [string, string] => Boolean(e[1]))),
      );
    })();
    return () => {
      active = false;
    };
  }, [tiktokKey]);




  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!artist) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="text-2xl font-bold text-[#111827]">Artist not found</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            This profile may not be approved yet.
          </p>
          <Button asChild variant="primary" size="sm" className="mt-6">
            <Link to="/artists">Back to artists</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const videos = artist.video_links
    .map((raw) => ({ raw, src: toEmbedUrl(raw), platform: detectVideoPlatform(raw) }))
    .filter((v): v is { raw: string; src: string; platform: NonNullable<ReturnType<typeof detectVideoPlatform>> } =>
      Boolean(v.src && v.platform),
    );

  const mediaItems: MediaItem[] = [
    ...artist.photo_urls.map((url) => ({
      kind: "image" as const,
      src: url,
      alt: `${artist.stage_name} photo`,
    })),
    ...videos.map((v) => ({
      kind: "video" as const,
      src: v.platform === "youtube" ? `${v.src}?autoplay=1` : v.src,
      title: `${artist.stage_name} video`,
      platform: v.platform,
    })),
  ];

  const photoCount = artist.photo_urls.length;
  const platformLabel = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok" } as const;



  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-56 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6] md:h-56 md:w-56">
            {artist.photo_urls[0] ? (
              <button
                type="button"
                onClick={() => setOpenIndex(0)}
                aria-label="View photo full size"
                className="h-full w-full"
              >
                <img
                  src={artist.photo_urls[0]}
                  alt={`${artist.stage_name} performing`}
                  className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
                />
              </button>
            ) : (
              <Music2 className="h-8 w-8 text-[#9CA3AF]" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-[#111827] md:text-4xl">
              {artist.stage_name}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              {artist.genres.map((g) => (
                <Badge key={g} className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]">
                  {g}
                </Badge>
              ))}
            </div>
            {artist.rate_info ? (
              <p className="mt-4 text-sm text-[#111827]">
                <span className="font-medium">Rate:</span> {artist.rate_info}
              </p>
            ) : null}
            {artist.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
                {artist.bio}
              </p>
            ) : null}
          </div>
        </div>

        {photoCount > 1 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[#111827]">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {artist.photo_urls.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D946EF]"
                >
                  <img
                    src={url}
                    alt={`${artist.stage_name} photo`}
                    loading="lazy"
                    className="h-40 w-full cursor-zoom-in object-cover transition hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {videos.length ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[#111827]">Videos</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {videos.map((v, i) => {
                const thumb =
                  v.platform === "youtube"
                    ? youtubeThumbnailUrl(v.raw)
                    : v.platform === "tiktok"
                      ? tiktokThumbs[v.raw] ?? null
                      : null;
                return (
                  <button
                    key={v.raw}
                    type="button"
                    onClick={() => setOpenIndex(photoCount + i)}
                    className="group relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] transition hover:border-[#D946EF] hover:bg-[#FDF4FF] focus:outline-none focus:ring-2 focus:ring-[#D946EF]"
                  >
                    {thumb ? (
                      <>
                        <img
                          src={thumb}
                          alt={`${artist.stage_name} ${platformLabel[v.platform]} video thumbnail`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-[1.03]"
                        />
                        <span className="absolute inset-0 bg-black/30 transition group-hover:bg-black/40" />
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#D946EF] text-white transition group-hover:scale-105">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                        <span className="relative text-xs font-medium text-white">
                          {platformLabel[v.platform]}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D946EF] text-white transition group-hover:scale-105">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                        <span className="text-sm font-medium text-[#111827]">
                          {platformLabel[v.platform]}
                        </span>
                        <span className="text-xs text-[#6B7280]">Tap to play</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      {openIndex !== null ? (
        <MediaLightbox
          items={mediaItems}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      ) : null}
    </PageWrapper>
  );

}
