import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useOrganiserEvents } from "@/hooks/useOrganiserEvents";
import { ExportAttendeesButton } from "@/components/organiser/ExportAttendeesButton";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types";

type FilterKey = "all" | "published" | "pending_review" | "rejected" | "draft";

export const Route = createFileRoute("/dashboard/organiser/events")({
  head: () => ({ meta: [{ title: "My Events | AuraPass" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    filter: (typeof s.filter === "string" ? s.filter : "all") as FilterKey,
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <MyEventsPage />
    </ProtectedRoute>
  ),
});

const TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "pending_review", label: "Pending Review" },
  { key: "rejected", label: "Rejected" },
  { key: "draft", label: "Draft" },
];

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

function MyEventsPage() {
  const { user } = useAuth();
  const { events, loading } = useOrganiserEvents(user?.id);
  const search = Route.useSearch();
  const [tab, setTab] = useState<FilterKey>(search.filter ?? "all");

  const filtered = useMemo(
    () => (tab === "all" ? events : events.filter((e) => e.status === tab)),
    [events, tab],
  );

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Events</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Manage every event you've created.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/dashboard/organiser">Back</Link>
              </Button>
              <Button asChild variant="primary">
                <Link to="/dashboard/organiser/create-event">+ Create Event</Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-[#E5E7EB]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-[#D946EF] text-[#D946EF]"
                    : "border-transparent text-[#6B7280] hover:text-[#111827]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <Card
              className="mt-8 flex flex-col items-center justify-center gap-3 p-10 text-center"
              style={{ borderRadius: 12 }}
            >
              <p className="text-[#6B7280]">You haven't created any events yet</p>
              <Button asChild variant="primary">
                <Link to="/dashboard/organiser/create-event">Create your first event</Link>
              </Button>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4">
              {filtered.map((evt) => (
                <EventCard key={evt.id} event={evt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function EventCard({ event }: { event: Event }) {
  const s = statusVariant(event.status);
  const isPublished = event.status === "published";
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-4 p-5 md:flex-row">
        <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6] md:w-44">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-[#9CA3AF]" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#111827]">{event.title}</h3>
            <Badge className={s.className}>{s.label}</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            {formatDate(event.event_date)} · {event.city}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-stretch md:w-40">
          {isPublished ? (
            <Button asChild variant="primary" size="sm">
              <Link
                to="/dashboard/organiser/scan/$eventId"
                params={{ eventId: event.id }}
              >
                Scan Tickets
              </Link>
            </Button>
          ) : (
            <Button variant="primary" size="sm" disabled>
              Scan Tickets
            </Button>
          )}
          {isPublished ? (
            <ExportAttendeesButton eventId={event.id} eventTitle={event.title} />
          ) : (
            <Button variant="outline" size="sm" disabled>
              Export CSV
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link
              to="/dashboard/organiser/edit-event/$eventId"
              params={{ eventId: event.id }}
            >
              Edit
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
