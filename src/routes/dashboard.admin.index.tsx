import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAdminEvents, type AdminEvent } from "@/hooks/useAdminEvents";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { ExportEventSalesButton } from "@/components/admin/ExportEventSalesButton";
import { ArtistApplicationsPanel } from "@/components/admin/ArtistApplicationsPanel";
import { EquipmentApplicationsPanel } from "@/components/admin/EquipmentApplicationsPanel";
import {
  approveEventCancellation,
  declineEventCancellation,
} from "@/lib/cancellation.functions";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin/")({
  head: () => ({ meta: [{ title: "Admin Panel | AuraPass" }] }),
  component: AdminDashboard,
});

type Tab =
  | "pending_review"
  | "published"
  | "rejected"
  | "cancellation_requests"
  | "artist_applications"
  | "equipment_applications";

function AdminDashboard() {
  const { events, loading, updateEventStatus, refetch } = useAdminEvents();
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets } = useMyTickets(email);
  const [tab, setTab] = useState<Tab>("pending_review");
  const [rejectTarget, setRejectTarget] = useState<AdminEvent | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [cancelAction, setCancelAction] = useState<
    { event: AdminEvent; action: "approve" | "decline" } | null
  >(null);
  const [cancelRemark, setCancelRemark] = useState("");
  const [cancelSubmitting, setCancelSubmitting] = useState(false);

  const counts = useMemo(
    () => ({
      pending_review: events.filter((e) => e.status === "pending_review").length,
      published: events.filter((e) => e.status === "published").length,
      rejected: events.filter((e) => e.status === "rejected").length,
      cancellation_requests: events.filter(
        (e) => e.cancellation_status === "requested",
      ).length,
    }),
    [events],
  );

  const filtered = useMemo(() => {
    if (tab === "cancellation_requests") {
      return events.filter((e) => e.cancellation_status === "requested");
    }
    return events.filter((e) => e.status === tab);
  }, [events, tab]);

  async function handleApprove(evt: AdminEvent) {
    const { error } = await updateEventStatus(evt.id, "published");
    if (error) toast.error(`Could not update event: ${error.message}`);
    else toast.success("Event approved");
  }

  function openRejectModal(evt: AdminEvent) {
    setRejectTarget(evt);
    setRejectReason("");
  }

  function closeRejectModal() {
    if (rejectSubmitting) return;
    setRejectTarget(null);
    setRejectReason("");
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const trimmed = rejectReason.trim();
    if (trimmed.length < 20) {
      toast.error("Please provide at least 20 characters explaining the rejection.");
      return;
    }
    setRejectSubmitting(true);
    const { error } = await updateEventStatus(rejectTarget.id, "rejected", trimmed);
    setRejectSubmitting(false);
    if (error) {
      toast.error(`Could not reject event: ${error.message}`);
      return;
    }
    toast.success("Event rejected");
    setRejectTarget(null);
    setRejectReason("");
  }

  function openCancelAction(event: AdminEvent, action: "approve" | "decline") {
    setCancelAction({ event, action });
    setCancelRemark("");
  }

  function closeCancelAction() {
    if (cancelSubmitting) return;
    setCancelAction(null);
    setCancelRemark("");
  }

  async function confirmCancelAction() {
    if (!cancelAction) return;
    const remark = cancelRemark.trim();
    if (remark.length < 10) {
      toast.error("Please provide at least 10 characters.");
      return;
    }
    setCancelSubmitting(true);
    try {
      if (cancelAction.action === "approve") {
        const res = await approveEventCancellation({
          data: { eventId: cancelAction.event.id, adminRemark: remark },
        });
        toast.success(
          `Cancellation approved. ${res.results.refunded} refund${
            res.results.refunded !== 1 ? "s" : ""
          } processed${res.results.failed > 0 ? `, ${res.results.failed} failed` : ""}.`,
        );
      } else {
        await declineEventCancellation({
          data: { eventId: cancelAction.event.id, adminRemark: remark },
        });
        toast.success("Cancellation request declined.");
      }
      setCancelAction(null);
      setCancelRemark("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
    setCancelSubmitting(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">Admin Panel</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Review organiser submissions and moderate events.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pending review" value={counts.pending_review} accent="amber" />
        <Stat label="Published" value={counts.published} accent="green" />
        <Stat label="Rejected" value={counts.rejected} accent="red" />
        <Link to="/dashboard/admin/tickets" className="group block">
          <Card
            className="p-5 border border-border transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderRadius: 12 }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              My Tickets
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{tickets.length}</p>
          </Card>
        </Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-border">
        <TabButton active={tab === "pending_review"} onClick={() => setTab("pending_review")}>
          Pending ({counts.pending_review})
        </TabButton>
        <TabButton active={tab === "published"} onClick={() => setTab("published")}>
          Published ({counts.published})
        </TabButton>
        <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>
          Rejected ({counts.rejected})
        </TabButton>
        <TabButton
          active={tab === "cancellation_requests"}
          onClick={() => setTab("cancellation_requests")}
        >
          Cancellation Requests ({counts.cancellation_requests})
        </TabButton>
        <TabButton
          active={tab === "artist_applications"}
          onClick={() => setTab("artist_applications")}
        >
          Artist Applications
        </TabButton>
        <TabButton
          active={tab === "equipment_applications"}
          onClick={() => setTab("equipment_applications")}
        >
          Equipment Applications
        </TabButton>
      </div>

      {tab === "artist_applications" ? (
        <ArtistApplicationsPanel />
      ) : tab === "equipment_applications" ? (
        <EquipmentApplicationsPanel />
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
          <p className="text-muted-foreground">
            {tab === "pending_review"
              ? "No events waiting for review. You're all caught up."
              : tab === "published"
              ? "No published events yet."
              : tab === "rejected"
              ? "No rejected events."
              : "No pending cancellation requests."}
          </p>
        </Card>
      ) : tab === "cancellation_requests" ? (
        <div className="mt-6 grid gap-4">
          {filtered.map((e) => (
            <CancellationRequestCard
              key={e.id}
              event={e}
              onApprove={() => openCancelAction(e, "approve")}
              onDecline={() => openCancelAction(e, "decline")}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {filtered.map((e) => (
            <EventModerationCard
              key={e.id}
              event={e}
              showActions={tab === "pending_review"}
              onApprove={handleApprove}
              onReject={openRejectModal}
            />
          ))}
        </div>
      )}

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) closeRejectModal();
        }}
      >
        <DialogContent className="bg-card sm:max-w-lg" style={{ borderRadius: 12 }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Reject this event</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Provide feedback so the organiser understands why their event was rejected.
              The reason will be shown on their dashboard.
            </DialogDescription>
          </DialogHeader>

          {rejectTarget ? (
            <div className="rounded-md border border-border bg-muted px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Event
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">{rejectTarget.title}</p>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium text-foreground"
            >
              Reason for rejection
            </label>
            <Textarea
              id="rejection-reason"
              rows={5}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Event details are incomplete, banner image is inappropriate, description is misleading..."
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              {rejectReason.trim().length} / 20 characters minimum
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeRejectModal}
              disabled={rejectSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmReject}
              disabled={rejectSubmitting || rejectReason.trim().length < 20}
              className="bg-destructive text-white hover:bg-destructive"
            >
              {rejectSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Rejecting…
                </span>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelAction !== null}
        onOpenChange={(open) => {
          if (!open) closeCancelAction();
        }}
      >
        <DialogContent className="bg-card sm:max-w-lg" style={{ borderRadius: 12 }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {cancelAction?.action === "approve"
                ? "Approve cancellation"
                : "Decline cancellation"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {cancelAction?.action === "approve"
                ? "This will mark the event as ended, issue Paystack refunds for every confirmed paid order, and email each buyer."
                : "The organiser will see your remark on their dashboard and the event will remain published."}
            </DialogDescription>
          </DialogHeader>

          {cancelAction ? (
            <div className="rounded-md border border-border bg-muted px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Event
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {cancelAction.event.title}
              </p>
              {cancelAction.event.cancellation_request_reason ? (
                <>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Organiser reason
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary whitespace-pre-wrap">
                    {cancelAction.event.cancellation_request_reason}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">
              Admin remark
            </label>
            <Textarea
              rows={4}
              value={cancelRemark}
              onChange={(e) => setCancelRemark(e.target.value)}
              placeholder={
                cancelAction?.action === "approve"
                  ? "Notes for internal records (visible to organiser)"
                  : "Explain why the cancellation is declined"
              }
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              {cancelRemark.trim().length} / 10 characters minimum
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeCancelAction}
              disabled={cancelSubmitting}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={confirmCancelAction}
              disabled={cancelSubmitting || cancelRemark.trim().length < 10}
              className={
                cancelAction?.action === "approve"
                  ? "bg-destructive text-white hover:bg-destructive"
                  : "bg-foreground text-white hover:bg-foreground-secondary"
              }
            >
              {cancelSubmitting ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Working…
                </span>
              ) : cancelAction?.action === "approve" ? (
                "Approve & Refund"
              ) : (
                "Decline Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CancellationRequestCard({
  event,
  onApprove,
  onDecline,
}: {
  event: AdminEvent;
  onApprove: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-4 p-5 md:flex-row">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent md:h-28 md:w-44">
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
            <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
            <Badge className="bg-warning-light text-warning-strong">Cancellation requested</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            by <span className="font-medium text-foreground">{event.organiser_name}</span>
            {event.organiser_email ? ` · ${event.organiser_email}` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.event_date)} · {event.venue}, {event.city}
          </p>
          {event.cancellation_request_reason ? (
            <div className="mt-2 rounded-md border border-warning-light bg-warning-light px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-warning-strong">
                Organiser reason
              </p>
              <p className="mt-1 text-sm text-warning-strong whitespace-pre-wrap">
                {event.cancellation_request_reason}
              </p>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col gap-2 md:w-40">
          <Button
            type="button"
            onClick={onApprove}
            className="bg-destructive text-white hover:bg-destructive"
          >
            Approve & Refund
          </Button>
          <Button
            type="button"
            onClick={onDecline}
            variant="outline"
          >
            Decline
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "amber" | "green" | "red";
}) {
  const colors = {
    amber: "text-warning-strong",
    green: "text-success-strong",
    red: "text-destructive-strong",
  }[accent];
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${colors}`}>{value}</p>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function statusBadge(status: AdminEvent["status"]) {
  switch (status) {
    case "published":
      return { className: "bg-success-light text-success-strong", label: "Published" };
    case "pending_review":
      return { className: "bg-warning-light text-warning-strong", label: "Pending review" };
    case "rejected":
      return { className: "bg-destructive-light text-destructive-strong", label: "Rejected" };
    default:
      return { className: "bg-accent text-foreground-secondary", label: status };
  }
}

function EventModerationCard({
  event,
  showActions,
  onApprove,
  onReject,
}: {
  event: AdminEvent;
  showActions: boolean;
  onApprove: (e: AdminEvent) => void;
  onReject: (e: AdminEvent) => void;
}) {
  const badge = statusBadge(event.status);
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-4 p-5 md:flex-row">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent md:h-28 md:w-44">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground-light" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">{event.title}</h3>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            by <span className="font-medium text-foreground">{event.organiser_name}</span> · {event.category}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.event_date)} · {(event.event_time ?? "").slice(0, 5)} · {event.venue}, {event.city}
          </p>

          {event.ticket_types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {event.ticket_types.map((t) => (
                <span
                  key={t.id}
                  className="rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground-secondary"
                >
                  {t.name} · {Number(t.price) === 0 ? "Free" : formatCurrency(Number(t.price))} · {t.quantity} avail
                </span>
              ))}
            </div>
          )}

          {event.status === "rejected" && event.rejection_reason ? (
            <div className="mt-3 rounded-md border border-destructive-strong bg-destructive-light px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive-strong">
                Reason for rejection
              </p>
              <p className="mt-1 text-sm text-destructive-strong whitespace-pre-wrap">
                {event.rejection_reason}
              </p>
            </div>
          ) : null}

          {event.status === "published" && (
            <div className="pt-1">
              <ExportEventSalesButton eventId={event.id} eventTitle={event.title} />
            </div>
          )}
        </div>


        {showActions && (
          <div className="flex shrink-0 flex-col gap-2 md:w-40">
            <Button
              type="button"
              onClick={() => onApprove(event)}
              className="bg-success text-white hover:bg-success-strong"
            >
              Approve
            </Button>
            <Button
              type="button"
              onClick={() => onReject(event)}
              className="bg-destructive text-white hover:bg-destructive"
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
