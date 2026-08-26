/**
 * Public equipment directory — active listings only (enforced by RLS).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { Speaker } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { usePublicEquipmentListings } from "@/hooks/useEquipmentListings";
import { formatNaira } from "@/lib/bookings";

export const Route = createFileRoute("/equipment/")({
  head: () => ({
    meta: [
      { title: "Rent Event Equipment in Nigeria | AuraPass" },
      {
        name: "description",
        content:
          "Browse sound systems, lighting, stages and more from verified equipment listers on AuraPass. Rent the gear your next event needs.",
      },
      { property: "og:title", content: "Rent Event Equipment in Nigeria | AuraPass" },
      {
        property: "og:description",
        content: "Sound, lighting, stages and more from verified AuraPass equipment listers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipmentDirectory,
});

function EquipmentDirectory() {
  const { listings, loading } = usePublicEquipmentListings();

  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-bold text-foreground md:text-4xl">Equipment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Rent sound, lighting and stage gear from verified listers on AuraPass.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8" />
          </div>
        ) : listings.length === 0 ? (
          <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
            <p className="text-muted-foreground">No equipment listed yet. Check back soon.</p>
          </Card>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <Link key={l.id} to="/equipment/$id" params={{ id: l.id }} className="group block">
                <Card
                  className="overflow-hidden border border-border transition-all group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md"
                  style={{ borderRadius: 12 }}
                >
                  <div className="flex h-48 items-center justify-center bg-accent">
                    {l.photo_urls?.[0] ? (
                      <img
                        src={l.photo_urls[0]}
                        alt={l.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Speaker className="h-8 w-8 text-muted-foreground-light" />
                    )}
                  </div>
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-foreground">{l.title}</h2>
                    {l.category ? (
                      <div className="mt-2">
                        <Badge className="bg-brand-tint text-brand-hover hover:bg-brand-tint">
                          {l.category}
                        </Badge>
                      </div>
                    ) : null}
                    <p className="mt-3 text-sm font-semibold text-foreground">
                      {formatNaira(l.rental_price)}
                    </p>
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
