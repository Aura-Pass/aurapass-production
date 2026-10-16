import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Mic2,
  Wrench,
  XCircle,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAdminCounts } from "@/hooks/useAdminCounts";

export const Route = createFileRoute("/dashboard/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview | AuraPass" },
      { name: "description", content: "Items across AuraPass that need an admin's attention." },
    ],
  }),
  component: AdminOverview,
});

interface AttentionItem {
  label: string;
  copy: string;
  count: number;
  icon: LucideIcon;
  to: string;
  search?: Record<string, string>;
}

function AdminOverview() {
  const { counts, loading } = useAdminCounts();

  const items: AttentionItem[] = [
    {
      label: "Events to review",
      copy: "Organiser submissions awaiting approval.",
      count: counts.pendingEvents,
      icon: CalendarCheck,
      to: "/dashboard/admin/moderation",
      search: { tab: "pending_review" },
    },
    {
      label: "Cancellation requests",
      copy: "Organisers asking to cancel an event.",
      count: counts.cancellations,
      icon: XCircle,
      to: "/dashboard/admin/moderation",
      search: { tab: "cancellation_requests" },
    },
    {
      label: "Artist applications",
      copy: "Artists waiting for profile approval.",
      count: counts.artistApplications,
      icon: Mic2,
      to: "/dashboard/admin/moderation",
      search: { tab: "artist_applications" },
    },
    {
      label: "Equipment applications",
      copy: "Equipment listers waiting for approval.",
      count: counts.equipmentApplications,
      icon: Wrench,
      to: "/dashboard/admin/moderation",
      search: { tab: "equipment_applications" },
    },
    {
      label: "Fund requests",
      copy: "Organiser payouts awaiting a decision.",
      count: counts.fundRequests,
      icon: WalletCards,
      to: "/dashboard/admin/fund-requests",
    },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);
  const open = items.filter((i) => i.count > 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What needs your attention across AuraPass.
        </p>
      </div>

      <Card className="p-5 md:p-6" style={{ borderRadius: 16 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Needs attention</h2>
            <p className="text-sm text-muted-foreground">Prioritised items across the platform.</p>
          </div>
          {!loading && total > 0 ? (
            <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-semibold text-primary">
              {total} {total === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : total === 0 ? (
          <div className="mt-5 flex items-center gap-4 rounded-xl border border-border bg-muted p-5">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div>
              <h3 className="font-semibold text-foreground">You're all caught up</h3>
              <p className="text-sm text-muted-foreground">No reviews need your attention.</p>
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {open.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.label}
                  className="flex flex-col rounded-xl border border-border bg-card p-5"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="mt-4 text-3xl font-bold text-foreground">{item.count}</p>
                  <h3 className="mt-1 font-semibold text-foreground">{item.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">{item.copy}</p>
                  <Link
                    to={item.to as never}
                    search={item.search as never}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Review queue <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
