/**
 * Public equipment listing page — gallery, details, price and locations.
 */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Speaker } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { MediaLightbox, type MediaItem } from "@/components/ui/MediaLightbox";
import { useEquipmentListing } from "@/hooks/useEquipmentListings";
import { formatNaira } from "@/lib/bookings";

export const Route = createFileRoute("/equipment/$id/")({
  head: () => ({
    meta: [
      { title: "Equipment Listing | AuraPass" },
      {
        name: "description",
        content:
          "See photos, rental price and delivery locations for this AuraPass equipment listing.",
      },
      { property: "og:title", content: "Equipment Listing | AuraPass" },
      {
        property: "og:description",
        content: "Photos, rental price and delivery locations for this AuraPass equipment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EquipmentListingPage,
});

function EquipmentListingPage() {
  const { id } = Route.useParams();
  const { listing, listerProfile, loading } = useEquipmentListing(id);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!listing) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="text-2xl font-bold text-[#111827]">Listing not found</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            This listing may have been removed or paused.
          </p>
          <Button asChild variant="primary" size="sm" className="mt-6">
            <Link to="/equipment">Back to equipment</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  const photos = listing.photo_urls ?? [];
  const mediaItems: MediaItem[] = photos.map((url) => ({
    kind: "image" as const,
    src: url,
    alt: listing.title,
  }));

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="flex h-56 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F3F4F6] md:h-56 md:w-56">
            {photos[0] ? (
              <button
                type="button"
                onClick={() => setOpenIndex(0)}
                aria-label="View photo full size"
                className="h-full w-full"
              >
                <img
                  src={photos[0]}
                  alt={listing.title}
                  className="h-full w-full cursor-zoom-in object-cover transition hover:opacity-90"
                />
              </button>
            ) : (
              <Speaker className="h-8 w-8 text-[#9CA3AF]" />
            )}
          </div>

          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-[#111827] md:text-4xl">{listing.title}</h1>
            {listing.category ? (
              <div className="mt-3">
                <Badge className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]">
                  {listing.category}
                </Badge>
              </div>
            ) : null}
            <p className="mt-4 text-xl font-semibold text-[#111827]">
              {formatNaira(listing.rental_price)}
            </p>
            {listerProfile ? (
              <Link
                to="/equipment-listers/$id"
                params={{ id: listerProfile.id }}
                className="mt-1 inline-block text-sm text-[#A21CAF] hover:underline"
              >
                Listed by {listerProfile.business_name}
              </Link>
            ) : null}
            <div className="mt-4">
              <Button asChild variant="primary" size="md">
                <Link to="/equipment/$id/request" params={{ id }}>
                  Request to Book
                </Link>
              </Button>
            </div>
            {listing.available_locations?.length ? (
              <p className="mt-2 text-sm text-[#6B7280]">
                Available in {listing.available_locations.join(", ")}
              </p>
            ) : null}
            {listing.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#374151]">
                {listing.description}
              </p>
            ) : null}
          </div>
        </div>

        {photos.length > 1 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-[#111827]">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {photos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setOpenIndex(i)}
                  className="overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D946EF]"
                >
                  <img
                    src={url}
                    alt={listing.title}
                    loading="lazy"
                    className="h-40 w-full cursor-zoom-in object-cover transition hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {openIndex !== null ? (
          <MediaLightbox
            items={mediaItems}
            index={openIndex}
            onIndexChange={setOpenIndex}
            onClose={() => setOpenIndex(null)}
          />
        ) : null}
      </div>
    </PageWrapper>
  );
}
