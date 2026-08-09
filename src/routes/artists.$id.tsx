/**
 * Public artist profile — gallery, embedded videos, genres and rate info.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useArtist } from "@/hooks/useArtists";
import { toEmbedUrl } from "@/lib/artists";

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

  const embeds = artist.video_links
    .map((v) => ({ raw: v, src: toEmbedUrl(v) }))
    .filter((v) => v.src);

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-56 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6] md:h-56 md:w-56">
            {artist.photo_urls[0] ? (
              <img
                src={artist.photo_urls[0]}
                alt={`${artist.stage_name} performing`}
                className="h-full w-full object-cover"
              />
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

        {artist.photo_urls.length > 1 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[#111827]">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {artist.photo_urls.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={`${artist.stage_name} photo`}
                  loading="lazy"
                  className="h-40 w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </section>
        ) : null}

        {embeds.length ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[#111827]">Videos</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {embeds.map((v) => (
                <Card key={v.raw} className="overflow-hidden" style={{ borderRadius: 12 }}>
                  <div className="aspect-video w-full">
                    <iframe
                      src={v.src as string}
                      title={`${artist.stage_name} video`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className="h-full w-full border-0"
                    />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageWrapper>
  );
}
