/**
 * Equipment lister booking inbox — requests organisers have sent for this
 * lister's gear.
 */
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EquipmentBookingList } from "@/components/equipment/EquipmentBookingList";

export const Route = createFileRoute("/dashboard/equipment/bookings")({
  head: () => ({
    meta: [
      { title: "Equipment Booking Requests | AuraPass" },
      {
        name: "description",
        content: "Review, negotiate and accept equipment rental requests from organisers.",
      },
      { property: "og:title", content: "Equipment Booking Requests | AuraPass" },
      {
        property: "og:description",
        content: "Manage your AuraPass equipment rental requests in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["equipment_lister", "admin"]}>
      <EquipmentListerBookingsPage />
    </ProtectedRoute>
  ),
});

function EquipmentListerBookingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Booking Requests</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Accept, decline or negotiate the price for each equipment request.
        </p>
      </div>
      <EquipmentBookingList perspective="lister" />
    </div>
  );
}
