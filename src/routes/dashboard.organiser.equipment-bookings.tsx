/**
 * Organiser equipment bookings — requests this organiser has sent to listers.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EquipmentBookingList } from "@/components/equipment/EquipmentBookingList";

export const Route = createFileRoute("/dashboard/organiser/equipment-bookings")({
  head: () => ({
    meta: [
      { title: "Equipment Bookings | AuraPass" },
      {
        name: "description",
        content: "Track the equipment you've requested for your events and negotiate prices.",
      },
      { property: "og:title", content: "Equipment Bookings | AuraPass" },
      {
        property: "og:description",
        content: "Manage equipment rental requests for your AuraPass events.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserEquipmentBookingsPage />
    </ProtectedRoute>
  ),
});

function OrganiserEquipmentBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Equipment Bookings</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Requests you've sent, their status and the negotiation thread.
        </p>
      </div>
      <EquipmentBookingList perspective="requester" />
    </div>
  );
}
