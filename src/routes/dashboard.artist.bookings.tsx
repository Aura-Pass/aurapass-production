/**
 * Artist booking inbox — requests organisers have sent to this artist.
 */
import { createFileRoute } from "@tanstack/react-router";
import { BookingList } from "@/components/bookings/BookingList";

export const Route = createFileRoute("/dashboard/artist/bookings")({
  head: () => ({
    meta: [
      { title: "Booking Inbox | AuraPass" },
      {
        name: "description",
        content: "Review, negotiate and accept event booking requests from organisers.",
      },
      { property: "og:title", content: "Booking Inbox | AuraPass" },
      {
        property: "og:description",
        content: "Manage your AuraPass performance booking requests in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArtistBookingInboxPage,
});

function ArtistBookingInboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Booking Inbox</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept, decline or negotiate the fee for each request.
        </p>
      </div>
      <BookingList perspective="artist" />
    </div>
  );
}
