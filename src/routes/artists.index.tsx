/**
 * Public artist directory — approved artist profiles only (enforced by RLS).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { usePublicArtists } from "@/hooks/useArtists";

export const Route = createFileRoute("/artists/")({
  head: () => ({
    meta: [
      { title: "Artists for Hire in Nigeria | AuraPass" },
      {
        name: "description",
        content:
          "Browse verified musicians, DJs and performers on AuraPass. Filter by genre and book the right act for your next event.",
      },
      { property: "og:title", content: "Artists for Hire in Nigeria | AuraPass" },
      {
        property: "og:description",
        content: "Discover verified musicians, DJs and performers for your next event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArtistsDirectory,
});

function ArtistsDirectory() {
  const { artists, loading } = usePublicArtists();

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-bold text-[#111827] md:text-4xl">Artists</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          Verified performers on AuraPass — discover and book acts for your next event.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
          </div>
        ) : artists.length === 0 ? (
          <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
            <p className="text-[#6B7280]">No artists listed yet. Check back soon.</p>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((a) => (
              <Link key={a.id} to="/artists/$id" params={{ id: a.id }} className="group block">
                <Card
                  className="overflow-hidden border border-[#E5E7EB] transition-all group-hover:-translate-y-0.5 group-hover:border-[#D946EF] group-hover:shadow-md"
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex h-48 items-center justify-center bg-[#F3F4F6]">
                    {a.photo_urls[0] ? (
                      <img
                        src={a.photo_urls[0]}
                        alt={`${a.stage_name} performing`}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Music2 className="h-8 w-8 text-[#9CA3AF]" />
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-[#111827]">{a.stage_name}</h2>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {a.genres.slice(0, 4).map((g) => (
                        <Badge
                          key={g}
                          className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]"
                        >
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
