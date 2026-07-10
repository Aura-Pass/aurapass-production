import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useOrganiserSales, type SaleRecord } from "@/hooks/useOrganiserSales";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/sales")({
  head: () => ({ meta: [{ title: "Sales | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <SalesPage />
    </ProtectedRoute>
  ),
});

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

function SalesPage() {
  const { sales, loading } = useOrganiserSales();
  const [tab, setTab] = useState<"by_event" | "by_type">("by_event");

  const totals = useMemo(() => {
    let tickets = 0;
    let revenue = 0;
    for (const s of sales) {
      tickets += s.quantitySold;
      revenue += s.revenue;
    }
    return { tickets, revenue };
  }, [sales]);

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Sales</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Revenue and ticket sales across all your events.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard/organiser">Back</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="p-5" style={{ borderRadius: 12 }}>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Total Tickets Sold
              </p>
              <p className="mt-2 text-2xl font-bold text-[#111827]">
                {loading ? "—" : totals.tickets}
              </p>
            </Card>
            <Card className="p-5" style={{ borderRadius: 12 }}>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-bold text-[#111827]">
                {loading ? "—" : naira(totals.revenue)}
              </p>
            </Card>
          </div>

          <div className="mt-8 flex gap-2 border-b border-[#E5E7EB]">
            <TabBtn active={tab === "by_event"} onClick={() => setTab("by_event")}>
              By Event
            </TabBtn>
            <TabBtn active={tab === "by_type"} onClick={() => setTab("by_type")}>
              By Ticket Type
            </TabBtn>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          ) : sales.length === 0 ? (
            <Card className="mt-8 p-10 text-center" style={{ borderRadius: 12 }}>
              <p className="text-[#6B7280]">No sales yet.</p>
            </Card>
          ) : tab === "by_event" ? (
            <ByEvent sales={sales} totals={totals} />
          ) : (
            <ByType sales={sales} />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function TabBtn({
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
      className={cn(
        "-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-[#D946EF] text-[#D946EF]"
          : "border-transparent text-[#6B7280] hover:text-[#111827]",
      )}
    >
      {children}
    </button>
  );
}

function ByEvent({
  sales,
  totals,
}: {
  sales: SaleRecord[];
  totals: { tickets: number; revenue: number };
}) {
  const grouped = useMemo(() => {
    const m = new Map<
      string,
      {
        eventId: string;
        eventTitle: string;
        eventDate: string;
        eventStatus: string;
        tickets: number;
        revenue: number;
        byType: Map<string, { name: string; sold: number; revenue: number }>;
      }
    >();
    for (const s of sales) {
      if (!m.has(s.eventId)) {
        m.set(s.eventId, {
          eventId: s.eventId,
          eventTitle: s.eventTitle,
          eventDate: s.eventDate,
          eventStatus: s.eventStatus,
          tickets: 0,
          revenue: 0,
          byType: new Map(),
        });
      }
      const g = m.get(s.eventId)!;
      g.tickets += s.quantitySold;
      g.revenue += s.revenue;
      const key = s.ticketTypeId || s.ticketTypeName;
      const cur =
        g.byType.get(key) ?? { name: s.ticketTypeName, sold: 0, revenue: 0 };
      cur.sold += s.quantitySold;
      cur.revenue += s.revenue;
      g.byType.set(key, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  return (
    <div className="mt-6 space-y-3">
      {grouped.map((g) => (
        <EventRow key={g.eventId} group={g} />
      ))}
      <Card
        className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderRadius: 12 }}
      >
        <p className="text-sm font-semibold text-[#111827]">Total</p>
        <p className="text-sm text-[#6B7280]">
          <span className="font-semibold text-[#111827]">{totals.tickets}</span> tickets ·{" "}
          <span className="font-semibold text-[#111827]">{naira(totals.revenue)}</span>
        </p>
      </Card>
    </div>
  );
}

function EventRow({
  group,
}: {
  group: {
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventStatus: string;
    tickets: number;
    revenue: number;
    byType: Map<string, { name: string; sold: number; revenue: number }>;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-[#FAFAFA]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#111827]">
            {group.eventTitle}
          </p>
          <p className="text-xs text-[#6B7280]">
            {formatDate(group.eventDate)} · {group.eventStatus}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-sm font-semibold text-[#111827]">{naira(group.revenue)}</p>
            <p className="text-xs text-[#6B7280]">{group.tickets} tickets</p>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[#6B7280] transition-transform",
              open && "rotate-180",
            )}
          />
        </div>
      </button>
      {open && (
        <div className="border-t border-[#E5E7EB] bg-[#FAFAFA] p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-[#6B7280]">
                <th className="py-2">Ticket Type</th>
                <th className="py-2 text-right">Sold</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(group.byType.values()).map((t) => (
                <tr key={t.name} className="border-t border-[#E5E7EB]">
                  <td className="py-2 text-[#111827]">{t.name}</td>
                  <td className="py-2 text-right text-[#111827]">{t.sold}</td>
                  <td className="py-2 text-right text-[#111827]">{naira(t.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function ByType({ sales }: { sales: SaleRecord[] }) {
  const rows = useMemo(() => {
    const m = new Map<
      string,
      { name: string; events: Set<string>; sold: number; revenue: number }
    >();
    for (const s of sales) {
      const cur =
        m.get(s.ticketTypeName) ??
        { name: s.ticketTypeName, events: new Set<string>(), sold: 0, revenue: 0 };
      cur.events.add(s.eventTitle);
      cur.sold += s.quantitySold;
      cur.revenue += s.revenue;
      m.set(s.ticketTypeName, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  return (
    <Card className="mt-6 overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="bg-[#F9FAFB]">
            <tr className="text-left text-xs uppercase tracking-wide text-[#6B7280]">
              <th className="p-4">Type</th>
              <th className="p-4">Events</th>
              <th className="p-4 text-right">Sold</th>
              <th className="p-4 text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="border-t border-[#E5E7EB]">
                <td className="p-4 font-semibold text-[#111827]">{r.name}</td>
                <td className="p-4 text-[#6B7280]">
                  {Array.from(r.events).slice(0, 3).join(", ")}
                  {r.events.size > 3 ? ` +${r.events.size - 3}` : ""}
                </td>
                <td className="p-4 text-right text-[#111827]">{r.sold}</td>
                <td className="p-4 text-right font-semibold text-[#111827]">
                  {naira(r.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
