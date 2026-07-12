import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useOrganiserEvents } from "@/hooks/useOrganiserEvents";
import { useOrganiserStats } from "@/hooks/useOrganiserStats";
import { useMyTickets } from "@/hooks/useMyTickets";

export const Route = createFileRoute("/dashboard/organiser/")({
  head: () => ({ meta: [{ title: "Organiser Dashboard | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserDashboard />
    </ProtectedRoute>
  ),
});

function OrganiserDashboard() {
  const { profile, user } = useAuth();
  const { events } = useOrganiserEvents(user?.id);
  const { ticketsSold, revenue, loading: statsLoading } = useOrganiserStats(user?.id);
  const email = profile?.email ?? user?.email;
  const { tickets: myTickets, loading: ticketsLoading } = useMyTickets(email);

  const eventsCreated = events.length;
  const upcoming = events.filter(
    (e) => e.status === "published" && new Date(e.event_date) >= new Date(),
  ).length;

  const formatNaira = (n: number) =>
    `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  return (
    <>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                Welcome back, {profile?.username ? `@${profile.username}` : (profile?.full_name || "Organiser")}
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Manage your events and track your ticket sales.
              </p>
            </div>
            <Button asChild variant="primary">
              <Link to="/dashboard/organiser/create-event">+ Create Event</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label="Events Created"
              value={String(eventsCreated)}
              to="/dashboard/organiser/events"
            />
            <StatCard
              label="Total Tickets Sold"
              value={statsLoading ? "—" : String(ticketsSold)}
              to="/dashboard/organiser/sales"
            />
            <StatCard
              label="Revenue"
              value={statsLoading ? "—" : formatNaira(revenue)}
              to="/dashboard/organiser/sales"
            />
            <StatCard
              label="Upcoming Events"
              value={String(upcoming)}
              to="/dashboard/organiser/events"
              search={{ filter: "published" }}
            />
            <StatCard
              label="My Tickets"
              value={ticketsLoading ? "—" : String(myTickets.length)}
              to="/dashboard/organiser/tickets"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  to,
  search,
}: {
  label: string;
  value: string;
  to: string;
  search?: Record<string, string>;
}) {
  return (
    <Link
      to={to as any}
      search={search as any}
      className="group block"
    >
      <Card
        className="p-5 transition-all border border-[#E5E7EB] hover:border-[#D946EF] hover:-translate-y-0.5 hover:shadow-md"
        style={{ borderRadius: 12 }}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
          {label}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-2xl font-bold text-[#111827]">{value}</p>
          <ArrowRight className="h-4 w-4 text-[#9CA3AF] transition-colors group-hover:text-[#D946EF]" />
        </div>
      </Card>
    </Link>
  );
}
