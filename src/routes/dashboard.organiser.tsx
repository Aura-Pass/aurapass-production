import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/organiser")({
  head: () => ({ meta: [{ title: "Organiser Dashboard — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserDashboard />
    </ProtectedRoute>
  ),
});

function OrganiserDashboard() {
  const { profile } = useAuth();

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
            Welcome back, {profile?.full_name || "Organiser"}
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage your events and track your ticket sales.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Events Created" value="0" />
            <Stat label="Total Tickets Sold" value="0" />
            <Stat label="Revenue" value="₦0" />
            <Stat label="Upcoming Events" value="0" />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
    </Card>
  );
}
