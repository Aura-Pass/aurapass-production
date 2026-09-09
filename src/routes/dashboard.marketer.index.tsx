import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Copy, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/marketer")({
  head: () => ({ meta: [{ title: "My Sales | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["marketer"]}>
      <MarketerDashboardPage />
    </ProtectedRoute>
  ),
});

interface MarketerEventStat {
  event_id: string;
  event_title: string;
  event_slug: string | null;
  referral_code: string;
  confirmed_orders: number;
  tickets_sold: number;
  gross_revenue: number;
}

function MarketerDashboardPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<MarketerEventStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await (supabase as any).rpc("get_my_marketer_stats");

      if (!active) return;
      if (error) {
        setRows([]);
      } else {
        const mapped = ((data as any[]) ?? []).map((r) => ({
          event_id: r.event_id,
          event_title: r.event_title,
          event_slug: r.event_slug,
          referral_code: r.referral_code,
          confirmed_orders: Number(r.confirmed_orders ?? 0),
          tickets_sold: Number(r.tickets_sold ?? 0),
          gross_revenue: Number(r.gross_revenue ?? 0),
        })) as MarketerEventStat[];
        setRows(mapped);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const totalConfirmedSales = rows.reduce((sum, r) => sum + r.confirmed_orders, 0);
  const totalTicketsSold = rows.reduce((sum, r) => sum + r.tickets_sold, 0);

  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success("Referral code copied");
      setTimeout(() => setCopiedCode((c) => (c === code ? null : c)), 2000);
    } catch {
      toast.error("Could not copy the code");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Sales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Events you're promoting and the tickets you've sold through your referral links.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5" style={{ borderRadius: 12 }}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total confirmed sales
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalConfirmedSales}</p>
        </Card>
        <Card className="p-5" style={{ borderRadius: 12 }}>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Total tickets sold
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalTicketsSold}</p>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <Megaphone className="mx-auto h-8 w-8 text-border-strong" />
          <p className="mt-3 text-sm text-muted-foreground">
            You haven't been assigned as a marketer for any events yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <Card
              key={r.event_id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderRadius: 12 }}
            >
              <div className="min-w-0 flex-1">
                <Link
                  to="/events/$slug"
                  params={{ slug: r.event_slug ?? r.event_id }}
                  className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
                >
                  {r.event_title}
                </Link>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Code:</span>
                  <code className="rounded bg-accent px-1.5 py-0.5 font-mono text-xs text-foreground">
                    {r.referral_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyCode(r.referral_code)}
                    title="Copy referral code"
                    aria-label="Copy referral code"
                  >
                    {copiedCode === r.referral_code ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center sm:w-auto sm:min-w-[240px]">
                <div className="rounded-md bg-muted px-2 py-2">
                  <p className="text-sm font-semibold text-foreground">{r.confirmed_orders}</p>
                  <p className="text-[11px] text-muted-foreground">Sales</p>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <p className="text-sm font-semibold text-foreground">{r.tickets_sold}</p>
                  <p className="text-[11px] text-muted-foreground">Tickets</p>
                </div>
                <div className="rounded-md bg-muted px-2 py-2">
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(r.gross_revenue)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Revenue</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
