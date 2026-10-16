import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { formatNaira } from "@/lib/utils";
import { getPlatformRevenue } from "@/lib/admin.functions";

type Data = Awaited<ReturnType<typeof getPlatformRevenue>>;
type Range = 30 | 90 | "all";
type Mix = "combined" | "tickets" | "merch";
type View = "live" | "past" | "all";

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Toggle<T extends string | number>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-md bg-accent p-1">
      {options.map(([v, label]) => (
        <Button key={String(v)} variant="ghost" size="sm" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`h-7 px-2 text-xs ${value === v ? "bg-card text-foreground" : "text-muted-foreground"}`}>{label}</Button>
      ))}
    </div>
  );
}

export function PlatformRevenue() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>(30);
  const [mix, setMix] = useState<Mix>("combined");
  const [view, setView] = useState<View>("live");
  const [q, setQ] = useState("");

  useEffect(() => {
    getPlatformRevenue().then(setData).catch((e) => setError(e instanceof Error ? e.message : "Could not load revenue"));
  }, []);

  const chart = useMemo(() => {
    if (!data) return [];
    const byDay = new Map<string, { tickets: number; merch: number; combined: number }>();
    for (const s of data.sales) {
      const k = dayKey(new Date(s.createdAt));
      const cur = byDay.get(k) ?? { tickets: 0, merch: 0, combined: 0 };
      cur.tickets += s.tickets; cur.merch += s.merch; cur.combined += s.total;
      byDay.set(k, cur);
    }
    const end = new Date(); end.setHours(0, 0, 0, 0);
    let start = new Date(end);
    if (range === "all") {
      const keys = [...byDay.keys()].sort();
      if (!keys.length) return [];
      start = new Date(`${keys[0]}T00:00:00`);
    } else start.setDate(start.getDate() - range + 1);
    const out = [];
    for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const v = byDay.get(dayKey(d));
      out.push({ date: d.toLocaleDateString("en-NG", { day: "numeric", month: "short" }), value: v ? v[mix] : 0 });
    }
    return out;
  }, [data, range, mix]);

  const rows = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.events
      .filter((e) => view === "all" || (view === "live" ? e.state === "live" : e.state !== "live"))
      .filter((e) => !term || e.title.toLowerCase().includes(term) || e.organiser.toLowerCase().includes(term))
      .sort((a, b) => b.gross - a.gross);
  }, [data, view, q]);

  if (error) return <Card className="p-5 text-sm text-destructive">{error}</Card>;
  if (!data) return <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>;

  const chartTotal = chart.reduce((s, c) => s + c.value, 0);

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Revenue over time</h2>
            <p className="text-xs text-muted-foreground">Confirmed orders only · {formatNaira(chartTotal)} in range</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle value={mix} onChange={setMix} options={[["combined", "Combined"], ["tickets", "Tickets"], ["merch", "Merch"]]} />
            <Toggle value={range} onChange={setRange} options={[[30, "30D"], [90, "90D"], ["all", "All time"]]} />
          </div>
        </div>
        <div className="mt-4 h-64">
          {chartTotal === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">No confirmed sales in this range.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} minTickGap={40} axisLine={false} tickLine={false} />
                <YAxis width={52} tickFormatter={(v) => (Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v))} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => formatNaira(v)} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 8 }} />
                <Area name="Revenue" type="monotone" dataKey="value" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-foreground">Event revenue</h2>
          <div className="flex flex-wrap gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search event or organiser" className="h-9 w-56" />
            <Toggle value={view} onChange={setView} options={[["live", "Live"], ["past", "Past"], ["all", "All"]]} />
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">No events match.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr className="border-b border-border">
                  {["Event", "Date", "Status", "Gross", "Platform fees", "Earnings", "Withdrawn", "Pending", "Balance", "Available now"].map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-3"><p className="font-medium text-foreground">{r.title}</p><p className="text-xs text-muted-foreground">{r.organiser}</p></td>
                    <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">{new Date(r.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-2 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${r.state === "live" ? "bg-primary/15 text-primary" : r.state === "cancelled" ? "bg-destructive/15 text-destructive" : "bg-accent text-muted-foreground"}`}>{r.state === "live" ? "Live" : r.state === "past" ? "Past" : "Cancelled"}</span></td>
                    <td className="whitespace-nowrap px-2 py-3 font-semibold text-foreground">{formatNaira(r.gross)}</td>
                    <td className="whitespace-nowrap px-2 py-3">{formatNaira(r.fees)}</td>
                    <td className="whitespace-nowrap px-2 py-3">{formatNaira(r.earnings)}</td>
                    <td className="whitespace-nowrap px-2 py-3">{formatNaira(r.withdrawn)}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-muted-foreground">{formatNaira(r.pending)}</td>
                    <td className="whitespace-nowrap px-2 py-3">
                      <span className={r.balance < 0 ? "font-semibold text-destructive" : ""}>{formatNaira(r.balance)}</span>
                      {r.withdrawn > r.earnings && (
                        <span className="mt-1 block w-fit rounded bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">Over-withdrawn {formatNaira(r.withdrawn - r.earnings)}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3">{r.state !== "live" ? "—" : r.available === null ? "Unavailable" : formatNaira(r.available)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
