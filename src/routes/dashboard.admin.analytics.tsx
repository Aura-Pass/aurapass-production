import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin/analytics")({
  head: () => ({ meta: [{ title: "Platform Analytics | AuraPass" }] }),
  component: PlatformAnalytics,
});

interface Stats {
  users: number;
  organisers: number;
  events: number;
  publishedEvents: number;
  orders: number;
  revenue: number;
}

function PlatformAnalytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const db = supabase as any;
      const [users, organisers, events, published, orders] = await Promise.all([
        db.from("profiles").select("*", { count: "exact", head: true }),
        db.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "organiser"),
        db.from("events").select("*", { count: "exact", head: true }),
        db.from("events").select("*", { count: "exact", head: true }).eq("status", "published"),
        db.from("orders").select("total_amount, status").eq("status", "confirmed"),
      ]);

      if (!active) return;
      const rows = (orders.data as Array<{ total_amount: number | null }> | null) ?? [];
      setStats({
        users: users.count ?? 0,
        organisers: organisers.count ?? 0,
        events: events.count ?? 0,
        publishedEvents: published.count ?? 0,
        orders: rows.length,
        revenue: rows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0),
      });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Platform Analytics</h1>
        <p className="mt-1 text-sm text-[#6B7280]">A live snapshot of AuraPass activity.</p>
      </div>

      {loading || !stats ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Stat label="Total users" value={String(stats.users)} />
          <Stat label="Organisers" value={String(stats.organisers)} />
          <Stat label="Events created" value={String(stats.events)} />
          <Stat label="Published events" value={String(stats.publishedEvents)} />
          <Stat label="Confirmed orders" value={String(stats.orders)} />
          <Stat label="Gross revenue" value={formatCurrency(stats.revenue)} />
        </div>
      )}
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
