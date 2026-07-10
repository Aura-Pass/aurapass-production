import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";

export const Route = createFileRoute("/dashboard/attendee/")({
  head: () => ({ meta: [{ title: "My Dashboard | AuraPass" }] }),
  component: AttendeeOverview,
});

function AttendeeOverview() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tickets.filter((t) => {
      if (!t.event?.event_date) return false;
      return new Date(t.event.event_date) >= today;
    }).length;
  }, [tickets]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
          Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Here's a snapshot of your activity on AuraPass.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/attendee/tickets" className="group block">
          <Card
            className="p-5 border border-[#E5E7EB] transition-all hover:border-[#D946EF] hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderRadius: 12 }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
              My Tickets
            </p>
            <p className="mt-2 text-2xl font-bold text-[#111827]">
              {loading ? "—" : String(tickets.length)}
            </p>
          </Card>
        </Link>
        <Stat label="Saved Events" value="0" />
        <Stat label="Upcoming Events" value={loading ? "—" : String(upcomingCount)} />
      </div>
    </div>
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
