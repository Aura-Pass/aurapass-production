import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon, ChevronRight, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useOrganiserEvents } from "@/hooks/useOrganiserEvents";
import { EventOverview } from "@/components/organiser/EventOverview";
import { OrganiserBackButton } from "@/components/organiser/OrganiserBackButton";
import { formatDate } from "@/lib/utils";
import { requestEventCancellation } from "@/lib/cancellation.functions";
import type { Event } from "@/types";

type FilterKey = "all" | "published" | "pending_review" | "rejected" | "draft";

export const Route = createFileRoute("/dashboard/organiser/events")({
  head: () => ({ meta: [
    { title: "Manage Your Events | AuraPass" },
    { name: "description", content: "Manage your AuraPass events, review confirmed sales and access organiser tools." },
    { property: "og:title", content: "Manage Your Events | AuraPass" },
    { property: "og:description", content: "Your events, sales performance and organiser tools on AuraPass." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  validateSearch: (s: Record<string, unknown>) => ({
    filter: (typeof s.filter === "string" ? s.filter : "all") as FilterKey,
    eventId: typeof s.eventId === "string" ? s.eventId : undefined,
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
      return { className: "bg-success-light text-success-strong", label: "Published" };
    case "pending_review":
      return { className: "bg-warning-light text-warning-strong", label: "Pending review" };
    case "rejected":
      return { className: "bg-destructive-light text-destructive-strong", label: "Rejected" };
    case "draft":
      return { className: "bg-accent text-foreground-secondary", label: "Draft" };
    case "sold_out":
      return { className: "bg-destructive-light text-destructive-strong", label: "Sold out" };
    case "ended":
      return { className: "bg-accent text-foreground-secondary", label: "Ended" };
    default:
      return { className: "bg-accent text-foreground-secondary", label: status };
  }
}

function MyEventsPage() {
  const { user } = useAuth();
  const { events, loading, refresh } = useOrganiserEvents(user?.id);
  const search = Route.useSearch();
  const [tab, setTab] = useState<FilterKey>(search.filter ?? "all");
  const [query, setQuery] = useState("");
  const selectedEvent = events.find((event) => event.id === search.eventId);

  const [cancellingEvent, setCancellingEvent] = useState<Event | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const filtered = useMemo(
    () => events.filter((e) => (tab === "all" || e.status === tab) && `${e.title} ${e.city} ${e.venue}`.toLowerCase().includes(query.toLowerCase())),
    [events, tab, query],
  );

  function closeCancel() {
    if (cancelling) return;
    setCancellingEvent(null);
    setCancelReason("");
  }

  async function confirmCancel() {
    if (!cancellingEvent || !user?.id) return;
    if (cancelReason.trim().length < 20) return;
    setCancelling(true);
    try {
      await requestEventCancellation({
        data: {
          eventId: cancellingEvent.id,
          organiserId: user.id,
          reason: cancelReason.trim(),
        },
      });
      toast.success(
        "Cancellation request submitted. Admin will review within 24 hours.",
      );
      setCancellingEvent(null);
      setCancelReason("");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Could not submit request");
    }
    setCancelling(false);
  }

  return (
    <>
      <div className="organiser-event min-h-screen bg-muted">
        <div className="mx-auto max-w-7xl py-4 md:py-6">
          {selectedEvent ? <EventOverview key={selectedEvent.id} event={selectedEvent} onCancel={() => setCancellingEvent(selectedEvent)} /> : <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-sans text-2xl font-extrabold text-foreground md:text-3xl">My events</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage every event you've created.
              </p>
            </div>
            <div className="flex gap-2">
              <OrganiserBackButton variant="outline" fallback="/dashboard/organiser" />
              <Button asChild variant="primary">
                <Link to="/dashboard/organiser/create-event"><Plus /> Create event</Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2 border-b border-border">
            {TABS.map((t) => (
              <Button
                variant="ghost"
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`-mb-px rounded-none border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}{t.key === "all" && <span className="rounded-full bg-accent px-1.5 text-[10px] text-muted-foreground">{events.length}</span>}
              </Button>
            ))}
          </div>

          <label className="mt-4 flex max-w-sm items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-muted-foreground">
            <Search className="h-4 w-4 shrink-0" />
            <input aria-label="Search your events" placeholder="Search events" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 w-full bg-transparent text-xs text-foreground outline-none" />
          </label>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <Card
              className="mt-8 flex flex-col items-center justify-center gap-3 p-10 text-center"
              
            >
              <p className="text-muted-foreground">{events.length ? "No events match your search." : "You haven’t created any events yet."}</p>
              <Button asChild variant="primary">
                <Link to="/dashboard/organiser/create-event">Create your first event</Link>
              </Button>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4">
              {filtered.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  filter={tab}
                />
              ))}
            </div>
          )}
          </>}
        </div>
      </div>

      {cancellingEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          onClick={closeCancel}
        >
          <div
            className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-foreground">Request cancellation?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Your request will be reviewed by the AuraPass admin team within 24 hours.
              If approved, all confirmed paid buyers will be refunded automatically via
              Paystack and notified by email.
            </p>
            <div className="mt-4 rounded-md border border-border bg-muted px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Event
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {cancellingEvent.title}
              </p>
            </div>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Reason for cancellation (required)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Venue unavailability, weather conditions..."
                rows={3}
                minLength={20}
                className="w-full resize-none rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted-foreground-light">
                {cancelReason.trim().length}/20 minimum
              </p>
            </div>

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                type="button"
                onClick={closeCancel}
                disabled={cancelling}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-60"
              >
                Keep Event
              </Button>
              <Button
                variant="destructive"
                type="button"
                disabled={cancelReason.trim().length < 20 || cancelling}
                onClick={confirmCancel}
                className="flex-1 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground hover:bg-destructive disabled:opacity-50"
              >
                {cancelling ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function EventCard({ event, filter }: { event: Event; filter: FilterKey }) {
  const s = statusVariant(event.status);
  return (
    <Card className="overflow-hidden rounded-lg">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent sm:h-20 sm:w-24">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground-light" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" className="h-auto justify-start whitespace-normal p-0 text-left text-sm font-bold hover:bg-transparent"><Link to="/dashboard/organiser/events" search={{ filter, eventId: event.id }}>{event.title}</Link></Button>
            <Badge className={s.className}>{s.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.event_date)} · {event.venue}, {event.city}
          </p>
          {event.cancellation_status === "requested" && (
            <div className="mt-1 rounded-md border border-warning-light bg-warning-light px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-warning-strong">
                Cancellation pending admin review
              </p>
            </div>
          )}
          {event.cancellation_status === "declined" && event.cancellation_admin_remark && (
            <div className="mt-1 rounded-md border border-destructive-strong bg-destructive-light px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive-strong">
                Cancellation declined
              </p>
              <p className="mt-1 text-sm text-destructive-strong whitespace-pre-wrap">
                {event.cancellation_admin_remark}
              </p>
            </div>
          )}
        </div>
        <Button asChild variant="ghost" size="sm" className="shrink-0 justify-start text-primary"><Link to="/dashboard/organiser/events" search={{ filter, eventId: event.id }}>Manage event <ChevronRight /></Link></Button>
      </div>
    </Card>
  );
}

