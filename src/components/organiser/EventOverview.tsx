import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronRight, ExternalLink, ImageIcon, MapPin, ScanLine, Ticket, Store, Wallet, Users, Pencil, Megaphone } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ExportAttendeesButton } from "@/components/organiser/ExportAttendeesButton";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Event, TicketType } from "@/types";

interface OrderRow {
  id: string; quantity: number; ticket_price: number; ticket_type_id: string | null;
  created_at: string; merch_pickup_status: string | null;
  order_merch_items: { quantity: number; unit_price: number }[];
}

export function EventOverview({ event, onBack, onCancel }: { event: Event; onBack: () => void; onCancel: () => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tiers, setTiers] = useState<TicketType[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [period, setPeriod] = useState(30);
  const [tab, setTab] = useState("Overview");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      const [orderResult, tierResult, balanceResult] = await Promise.all([
        (supabase as any).from("orders").select("id, quantity, ticket_price, ticket_type_id, created_at, merch_pickup_status, order_merch_items(quantity, unit_price)").eq("event_id", event.id).eq("status", "confirmed").order("created_at", { ascending: true }),
        (supabase as any).from("ticket_types").select("*").eq("event_id", event.id).order("created_at", { ascending: true }),
        (supabase as any).rpc("get_event_payable_balance", { p_event_id: event.id }),
      ]);
      if (!active) return;
      setError(Boolean(orderResult.error || tierResult.error));
      setOrders(orderResult.data ?? []);
      setTiers(tierResult.data ?? []);
      const raw = Array.isArray(balanceResult.data) ? balanceResult.data[0] : balanceResult.data;
      const amount = Number(raw && typeof raw === "object" ? raw.payable_balance ?? raw.balance ?? raw.available : raw);
      setBalance(balanceResult.error || raw == null || !Number.isFinite(amount) ? null : amount);
      setLoading(false);
    })().catch(() => { if (active) { setError(true); setLoading(false); } });
    return () => { active = false; };
  }, [event.id]);

  const stats = useMemo(() => {
    const tickets = orders.reduce((sum, o) => sum + (o.ticket_type_id ? Number(o.quantity) : 0), 0);
    const ticketRevenue = orders.reduce((sum, o) => sum + Number(o.ticket_price) * Number(o.quantity), 0);
    const merchRevenue = orders.reduce((sum, o) => sum + (o.order_merch_items ?? []).reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0), 0);
    const merchOrders = orders.filter(o => o.order_merch_items?.length);
    return { tickets, ticketRevenue, merchRevenue, collected: merchOrders.filter(o => o.merch_pickup_status === "collected").length, pending: merchOrders.filter(o => o.merch_pickup_status !== "collected").length };
  }, [orders]);
  const chart = useMemo(() => {
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - period + 1);
    return Array.from({ length: period }, (_, i) => {
      const day = new Date(start); day.setDate(day.getDate() + i);
      const rows = orders.filter(o => new Date(o.created_at).toDateString() === day.toDateString());
      return { date: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), tickets: rows.reduce((s, o) => s + Number(o.quantity) * Number(o.ticket_price), 0), merch: rows.reduce((s, o) => s + (o.order_merch_items ?? []).reduce((v, m) => v + Number(m.quantity) * Number(m.unit_price), 0), 0) };
    });
  }, [orders, period]);
  const published = event.status === "published";
  const canCancel = published && !["requested", "approved"].includes(event.cancellation_status ?? "");

  const tools = <section className="event-tools min-w-0">
    <h2 className="mb-4 font-sans text-base font-bold">Event tools</h2>
    <div className="space-y-2">
      <Button asChild variant={published ? "primary" : "outline"} className="w-full justify-start" disabled={!published}><Link to="/dashboard/organiser/scan/$eventId" params={{ eventId: event.id }}><ScanLine /> Scan tickets <ChevronRight className="ml-auto" /></Link></Button>
      {published && <ExportAttendeesButton eventId={event.id} eventTitle={event.title} />}
      <Button asChild variant="ghost" className="w-full justify-start"><Link to="/dashboard/organiser/edit-event/$eventId" params={{ eventId: event.id }}><Pencil /> Edit event <ChevronRight className="ml-auto" /></Link></Button>
      <Button asChild variant="ghost" className="w-full justify-start"><Link to="/dashboard/organiser/gate-attendants/$eventId" params={{ eventId: event.id }}><Users /> Gate attendants <ChevronRight className="ml-auto" /></Link></Button>
      <Button asChild variant="ghost" className="w-full justify-start"><Link to="/dashboard/organiser/marketers/$eventId" params={{ eventId: event.id }}><Megaphone /> Marketers <ChevronRight className="ml-auto" /></Link></Button>
      <Button asChild variant="ghost" className="w-full justify-start"><Link to="/dashboard/organiser/merch/$eventId" params={{ eventId: event.id }}><Store /> Merchandise <ChevronRight className="ml-auto" /></Link></Button>
    </div>
    <Button variant="link" className="mt-4 w-full border-t border-border pt-4" onClick={() => setTab("Event settings")}>Event settings <ChevronRight /></Button>
  </section>;

  return <div className="organiser-event space-y-6">
    <Button variant="ghost" size="sm" className="px-0 text-muted-foreground" onClick={onBack}><ArrowLeft /> All events</Button>
    <header className="flex items-start gap-4">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent">{event.banner_url ? <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" /> : <ImageIcon className="text-muted-foreground" />}</div>
      <div className="min-w-0 flex-1"><div className="mb-2 flex flex-wrap items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${published ? "bg-success-light text-success-strong" : "bg-accent text-muted-foreground"}`}>{event.status.replaceAll("_", " ")}</span><span className="break-all text-[10px] text-muted-foreground">Event ID · {event.id}</span></div><h1 className="font-sans text-xl font-extrabold leading-tight md:text-2xl">{event.title}</h1><p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{formatDate(event.event_date)} · {event.event_time?.slice(0, 5)}</p><p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5 shrink-0" />{event.venue}, {event.city}</p></div>
      {event.slug && <Button asChild variant="outline" size="icon" title="View public event"><Link to="/events/$slug" params={{ slug: event.slug }} aria-label="View public event"><ExternalLink /></Link></Button>}
    </header>
    <div className="flex gap-6 overflow-x-auto border-b border-border" role="tablist" aria-label="Event views">{["Overview", "Tickets", "Event settings"].map(name => <Button key={name} variant="ghost" role="tab" aria-selected={tab === name} onClick={() => setTab(name)} className={`rounded-none border-b-2 px-0 text-xs ${tab === name ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>{name}</Button>)}</div>
    {loading ? <div className="flex justify-center py-20"><Spinner /></div> : error ? <p role="alert" className="py-10 text-destructive">Event sales couldn’t be loaded. Please refresh to try again.</p> : <>
      {tab === "Overview" && <>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
          { label: "Gross sales", value: formatCurrency(stats.ticketRevenue + stats.merchRevenue), icon: Wallet, detail: `Tickets ${formatCurrency(stats.ticketRevenue)}`, },
          { label: "Tickets sold", value: stats.tickets.toLocaleString(), icon: Ticket, detail: "Confirmed purchases" },
          { label: "Merch sales", value: formatCurrency(stats.merchRevenue), icon: Store, detail: `${stats.collected} collected · ${stats.pending} pending` },
          { label: "Confirmed orders", value: orders.length.toLocaleString(), icon: Users, detail: "Tickets and merchandise" },
        ].map(metric => <article key={metric.label} className="rounded-lg border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">{metric.label}</span><metric.icon className="h-7 w-7 shrink-0 rounded-md bg-brand-tint p-1.5 text-primary" /></div><strong className="mt-3 block break-words text-lg font-extrabold md:text-xl">{metric.value}</strong><p className="mt-2 text-[10px] text-muted-foreground">{metric.detail}</p></article>)}</div>
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_240px]"><div className="min-w-0 space-y-6"><section className="min-w-0 border-b border-border pb-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-sans text-base font-bold">Sales revenue</h2><div className="flex rounded-md bg-accent p-1">{[7, 30, 90].map(days => <Button key={days} variant="ghost" size="sm" onClick={() => setPeriod(days)} aria-pressed={period === days} className={`h-7 px-2 text-[10px] ${period === days ? "bg-card" : "text-muted-foreground"}`}>{days}D</Button>)}</div></div><div className="my-4 flex flex-wrap gap-4 text-xs text-muted-foreground"><span className="text-primary">● Tickets</span><span>● Merchandise</span></div><div className="h-56 min-w-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 5, right: 4, left: 0, bottom: 0 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="date" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} minTickGap={45} axisLine={false} tickLine={false} /><YAxis width={48} tickFormatter={v => Number(v) >= 1000 ? `${Number(v) / 1000}k` : String(v)} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: 8 }} /><Area name="Tickets" type="monotone" dataKey="tickets" stroke="var(--primary)" fill="var(--brand-soft)" strokeWidth={2} /><Area name="Merchandise" type="monotone" dataKey="merch" stroke="var(--foreground-secondary)" fill="transparent" strokeDasharray="4 4" strokeWidth={2} /></AreaChart></ResponsiveContainer></div></section><TicketPerformance tiers={tiers} orders={orders} /></div><div className="space-y-6">{tools}<section className="rounded-lg bg-foreground p-5 text-background"><p className="text-xs opacity-75">Available to withdraw</p><strong className="mt-2 block break-words text-xl">{balance === null ? "Unavailable" : formatCurrency(balance)}</strong><Button asChild variant="outline" className="mt-5 w-full"><Link to="/dashboard/organiser/fund-requests/$eventId" params={{ eventId: event.id }}>Request funds <ChevronRight /></Link></Button></section></div></div>
      </>}
      {tab === "Tickets" && <TicketPerformance tiers={tiers} orders={orders} />}
      {tab === "Event settings" && <div className="space-y-6">{tools}<div className="border-t border-border pt-6"><h2 className="font-sans text-base font-bold">Cancellation</h2>{event.cancellation_status === "requested" && <p className="mt-2 text-sm text-warning-strong">Cancellation pending admin review</p>}{event.cancellation_admin_remark && <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{event.cancellation_admin_remark}</p>}{canCancel && <Button variant="destructive" className="mt-4" onClick={onCancel}>Request cancellation</Button>}</div></div>}
    </>}
  </div>;
}

function TicketPerformance({ tiers, orders }: { tiers: TicketType[]; orders: OrderRow[] }) {
  return <section className="min-w-0"><h2 className="mb-4 font-sans text-base font-bold">Ticket performance</h2>{tiers.length === 0 ? <p className="text-sm text-muted-foreground">No ticket types yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-xs"><thead className="text-[10px] uppercase text-muted-foreground"><tr><th className="pb-3 font-medium">Ticket type</th><th className="pb-3 font-medium">Sold</th><th className="pb-3 font-medium">Revenue</th><th className="pb-3 font-medium">Progress</th></tr></thead><tbody>{tiers.map(t => { const rows = orders.filter(o => o.ticket_type_id === t.id); const sold = rows.reduce((s, o) => s + Number(o.quantity), 0); const revenue = rows.reduce((s, o) => s + Number(o.quantity) * Number(o.ticket_price), 0); const percent = t.quantity > 0 ? Math.min(100, Math.round(sold / t.quantity * 100)) : 0; return <tr key={t.id} className="border-t border-border"><td className="py-4 pr-3"><strong>{t.name}</strong><p className="mt-1 text-[10px] text-muted-foreground">{formatCurrency(Number(t.price))}</p></td><td className="pr-3">{sold} / {t.quantity}</td><td className="pr-3">{formatCurrency(revenue)}</td><td><div className="flex items-center gap-2"><progress className="event-sales-progress w-16" max={100} value={percent} aria-label={`${t.name} sales progress`} /><span className="text-[10px] text-muted-foreground">{percent}%</span></div></td></tr>; })}</tbody></table></div>}</section>;
}