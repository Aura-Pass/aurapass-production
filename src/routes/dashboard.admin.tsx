import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/PageWrapper";
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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAdminEvents, type AdminEvent } from "@/hooks/useAdminEvents";
import { formatCurrency, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin Panel | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

type Tab = "pending_review" | "published" | "rejected";

function AdminDashboard() {
  const { events, loading, updateEventStatus } = useAdminEvents();
  const [tab, setTab] = useState<Tab>("pending_review");

  const counts = useMemo(
    () => ({
      pending_review: events.filter((e) => e.status === "pending_review").length,
      published: events.filter((e) => e.status === "published").length,
      rejected: events.filter((e) => e.status === "rejected").length,
    }),
    [events],
  );

  const filtered = useMemo(
    () => events.filter((e) => e.status === tab),
    [events, tab],
  );

  async function handleDecision(
    evt: AdminEvent,
    status: "published" | "rejected",
  ) {
    const { error } = await updateEventStatus(evt.id, status);
    if (error) {
      toast.error(`Could not update event: ${error.message}`);
    } else {
      toast.success(
        status === "published" ? "Event approved" : "Event rejected",
      );
    }
  }

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
            Admin Panel
          </h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Review organiser submissions and moderate events.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Stat label="Pending review" value={counts.pending_review} accent="amber" />
            <Stat label="Published" value={counts.published} accent="green" />
            <Stat label="Rejected" value={counts.rejected} accent="red" />
          </div>

          <div className="mt-8 flex gap-2 border-b border-[#E5E7EB]">
            <TabButton active={tab === "pending_review"} onClick={() => setTab("pending_review")}>
              Pending ({counts.pending_review})
            </TabButton>
            <TabButton active={tab === "published"} onClick={() => setTab("published")}>
              Published ({counts.published})
            </TabButton>
            <TabButton active={tab === "rejected"} onClick={() => setTab("rejected")}>
              Rejected ({counts.rejected})
            </TabButton>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : filtered.length === 0 ? (
            <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
              <p className="text-[#6B7280]">
                {tab === "pending_review"
                  ? "No events waiting for review. You're all caught up."
                  : tab === "published"
                  ? "No published events yet."
                  : "No rejected events."}
              </p>
            </Card>
          ) : (
            <div className="mt-6 grid gap-4">
              {filtered.map((e) => (
                <EventModerationCard
                  key={e.id}
                  event={e}
                  showActions={tab === "pending_review"}
                  onDecision={handleDecision}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
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
    amber: "text-[#B45309]",
    green: "text-[#047857]",
    red: "text-[#B91C1C]",
  }[accent];
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
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
          ? "border-[#D946EF] text-[#D946EF]"
          : "border-transparent text-[#6B7280] hover:text-[#111827]"
      }`}
    >
      {children}
    </button>
  );
}

function statusBadge(status: AdminEvent["status"]) {
  switch (status) {
    case "published":
      return { className: "bg-[#ECFDF5] text-[#047857]", label: "Published" };
    case "pending_review":
      return { className: "bg-[#FFFBEB] text-[#B45309]", label: "Pending review" };
    case "rejected":
      return { className: "bg-[#FEE2E2] text-[#B91C1C]", label: "Rejected" };
    default:
      return { className: "bg-[#F3F4F6] text-[#374151]", label: status };
  }
}

function EventModerationCard({
  event,
  showActions,
  onDecision,
}: {
  event: AdminEvent;
  showActions: boolean;
  onDecision: (e: AdminEvent, status: "published" | "rejected") => void;
}) {
  const badge = statusBadge(event.status);
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-4 p-5 md:flex-row">
        <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#F3F4F6] md:h-28 md:w-44">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-[#9CA3AF]" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[#111827]">{event.title}</h3>
            <Badge className={badge.className}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-[#6B7280]">
            by <span className="font-medium text-[#111827]">{event.organiser_name}</span> · {event.category}
          </p>
          <p className="text-sm text-[#6B7280]">
            {formatDate(event.event_date)} · {(event.event_time ?? "").slice(0, 5)} · {event.venue}, {event.city}
          </p>

          {event.ticket_types.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {event.ticket_types.map((t) => (
                <span
                  key={t.id}
                  className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1 text-xs text-[#374151]"
                >
                  {t.name} · {Number(t.price) === 0 ? "Free" : formatCurrency(Number(t.price))} · {t.quantity} avail
                </span>
              ))}
            </div>
          )}
        </div>

        {showActions && (
          <div className="flex shrink-0 flex-col gap-2 md:w-40">
            <Button
              type="button"
              onClick={() => onDecision(event, "published")}
              className="bg-[#10B981] text-white hover:bg-[#059669]"
            >
              Approve
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onDecision(event, "rejected")}
            >
              Reject
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
