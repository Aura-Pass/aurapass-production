import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useOrganiserEvents } from "@/hooks/useOrganiserEvents";
import { useOrganiserStats } from "@/hooks/useOrganiserStats";
import { useMyTickets } from "@/hooks/useMyTickets";
import { useEventCheckInCount } from "@/hooks/useEventCheckInCount";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

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
  const { events, loading } = useOrganiserEvents(user?.id);
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
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                Welcome back, {profile?.full_name || "Organiser"}
              </h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Manage your events and track your ticket sales.
              </p>
            </div>
            <Button asChild variant="primary">
              <Link to="/dashboard/organiser/create-event">+ Create Event</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Events Created" value={String(eventsCreated)} />
            <Stat
              label="Total Tickets Sold"
              value={statsLoading ? "—" : String(ticketsSold)}
            />
            <Stat
              label="Revenue"
              value={statsLoading ? "—" : formatNaira(revenue)}
            />
            <Stat label="Upcoming Events" value={String(upcoming)} />
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-[#111827]">My Events</h2>

            {loading ? (
              <div className="mt-6 grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-5" style={{ borderRadius: 12 }}>
                    <div className="space-y-2">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-[#F3F4F6]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[#F3F4F6]" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card className="mt-6 flex flex-col items-center justify-center gap-3 p-10 text-center" style={{ borderRadius: 12 }}>
                <p className="text-[#6B7280]">You haven't created any events yet</p>
                <Button asChild variant="primary">
                  <Link to="/dashboard/organiser/create-event">Create your first event</Link>
                </Button>
              </Card>
            ) : (
              <div className="mt-6 grid gap-4">
                {events.map((evt) => (
                  <EventRow key={evt.id} event={evt} />
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-bold text-[#111827]">My Tickets</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Tickets you've purchased as an attendee. Tap an event to reveal QR codes.
            </p>
            <div className="mt-4">
              <MyTicketsList
                tickets={myTickets}
                loading={ticketsLoading}
                emptyCta={
                  <Button asChild variant="primary">
                    <Link to="/events">Discover Events</Link>
                  </Button>
                }
              />
            </div>
          </section>
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

function statusVariant(status: Event["status"]) {
  switch (status) {
    case "published":
      return { className: "bg-[#ECFDF5] text-[#047857]", label: "Published" };
    case "pending_review":
      return { className: "bg-[#FFFBEB] text-[#B45309]", label: "Pending review" };
    case "rejected":
      return { className: "bg-[#FEE2E2] text-[#B91C1C]", label: "Rejected" };
    case "draft":
      return { className: "bg-[#F3F4F6] text-[#374151]", label: "Draft" };
    case "sold_out":
      return { className: "bg-[#FEE2E2] text-[#B91C1C]", label: "Sold out" };
    case "ended":
      return { className: "bg-[#F3F4F6] text-[#374151]", label: "Ended" };
    default:
      return { className: "bg-[#F3F4F6] text-[#374151]", label: status };
  }
}

function EventRow({ event }: { event: Event }) {
  const s = statusVariant(event.status);
  const { checkedIn, total } = useEventCheckInCount(event.id);
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="truncate text-base font-semibold text-[#111827]">{event.title}</h3>
            <Badge className={s.className}>{s.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">
            {formatDate(event.event_date)} · {event.event_time?.slice(0, 5)} · {event.venue}
          </p>
          <p className="mt-1 text-xs font-medium text-[#6B7280]">
            {checkedIn} / {total} checked in
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {event.status === "published" ? (
            <Button asChild variant="primary" size="sm">
              <Link to="/dashboard/organiser/scan/$eventId" params={{ eventId: event.id }}>
                Scan Tickets
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/organiser/edit-event/$eventId" params={{ eventId: event.id }}>
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
