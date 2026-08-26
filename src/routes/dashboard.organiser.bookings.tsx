/**
 * Organiser booking management — requests this organiser has sent to artists.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BookingList } from "@/components/bookings/BookingList";

export const Route = createFileRoute("/dashboard/organiser/bookings")({
  head: () => ({
    meta: [
      { title: "Artist Bookings | AuraPass" },
      {
        name: "description",
        content: "Track the artists you've requested for your events and negotiate fees.",
      },
      { property: "og:title", content: "Artist Bookings | AuraPass" },
      {
        property: "og:description",
        content: "Manage artist booking requests for your AuraPass events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserBookingsPage />
    </ProtectedRoute>
  ),
});

function OrganiserBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Artist Bookings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests you've sent, their status and the negotiation thread.
        </p>
      </div>
      <BookingList perspective="organiser" />
    </div>
  );
}
