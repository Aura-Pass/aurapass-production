import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Platform-wide user count for admins. Browser reads of `profiles` are
 * RLS-limited, so a head count from the client under-reports. This verifies
 * the caller holds the admin role, then counts with the service-role client.
 */
export const getPlatformUserCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error: roleError } = await (context.supabase as any).rpc(
      "get_user_roles",
      { _user_id: context.userId },
    );
    if (roleError) throw new Error("Could not verify admin role");
    const list = ((roles as any[]) ?? []).map((r) => (typeof r === "string" ? r : r?.role));
    if (!list.includes("admin")) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await (supabaseAdmin as any)
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (error) throw new Error(`Could not count users: ${error.message}`);
    return { users: Number(count ?? 0) };
  });

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: roles, error } = await context.supabase.rpc("get_user_roles", { _user_id: context.userId });
  if (error) throw new Error("Could not verify admin role");
  const list = ((roles as any[]) ?? []).map((r) => (typeof r === "string" ? r : r?.role));
  if (!list.includes("admin")) throw new Error("Forbidden");
}

async function fetchAll(sb: any, table: string, columns: string, apply?: (q: any) => any) {
  const rows: any[] = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(columns).range(from, from + 999);
    if (apply) q = apply(q);
    const { data, error } = await q;
    if (error) throw new Error(`Could not load ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

/**
 * Platform revenue for admins: confirmed orders, per-event earnings and fund
 * requests. "Available to withdraw" comes from get_event_payable_balance — the
 * same function the organiser Request funds flow uses — called as the admin.
 */
export const getPlatformRevenue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sb = supabaseAdmin as any;

    const [events, orders, requests] = await Promise.all([
      fetchAll(sb, "events", "id, title, event_date, status, cancelled_at, cancellation_status, organiser_id"),
      fetchAll(sb, "orders", "id, event_id, ticket_type_id, ticket_price, quantity, platform_fee, total_amount, created_at", (q) => q.eq("status", "confirmed")),
      fetchAll(sb, "organiser_fund_requests", "*"),
    ]);
    const orderIds = new Set(orders.map((o) => o.id));
    const merchRows = (await fetchAll(sb, "order_merch_items", "order_id, subtotal")).filter((m) => orderIds.has(m.order_id));
    const merchByOrder = new Map<string, number>();
    for (const m of merchRows) merchByOrder.set(m.order_id, (merchByOrder.get(m.order_id) ?? 0) + Number(m.subtotal ?? 0));

    const organiserIds = Array.from(new Set(events.map((e) => e.organiser_id).filter(Boolean)));
    const profiles = organiserIds.length
      ? ((await sb.from("profiles").select("id, full_name, username").in("id", organiserIds)).data ?? [])
      : [];
    const orgName = new Map<string, string>(profiles.map((p: any) => [p.id, p.full_name || (p.username ? `@${p.username}` : "")]));

    const sales = orders.map((o) => {
      const merch = merchByOrder.get(o.id) ?? 0;
      const tickets = o.ticket_type_id ? Number(o.ticket_price ?? 0) * Number(o.quantity ?? 0) : 0;
      return { createdAt: o.created_at as string, tickets, merch, total: Number(o.total_amount ?? 0) };
    });

    const today = new Date().toISOString().slice(0, 10);
    const balances = new Map<string, number | null>();
    const rows = events.map((e) => {
      const eo = orders.filter((o) => o.event_id === e.id);
      const gross = eo.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
      const fees = eo.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0);
      const er = requests.filter((r) => r.event_id === e.id);
      const amt = (r: any) => Number(r.amount ?? r.amount_requested ?? 0);
      const withdrawn = er.filter((r) => ["approved", "paid"].includes(r.status)).reduce((s, r) => s + amt(r), 0);
      const pending = er.filter((r) => r.status === "pending").reduce((s, r) => s + amt(r), 0);
      const cancelled = Boolean(e.cancelled_at) || e.cancellation_status === "approved";
      const state = cancelled ? "cancelled" : String(e.event_date).slice(0, 10) < today ? "past" : "live";
      return {
        id: e.id as string,
        title: e.title as string,
        date: e.event_date as string,
        organiser: orgName.get(e.organiser_id) ?? "",
        state: state as "live" | "past" | "cancelled",
        gross, fees, earnings: gross - fees, withdrawn, pending,
        balance: gross - fees - withdrawn,
        available: null as number | null,
      };
    });

    await Promise.all(rows.filter((r) => r.state === "live").map(async (r) => {
      const { data, error } = await (context.supabase as any).rpc("get_event_payable_balance", { p_event_id: r.id });
      if (error) return balances.set(r.id, null);
      const raw = Array.isArray(data) ? data[0] : data;
      const v = raw && typeof raw === "object" ? Number(raw.payable_balance ?? raw.balance ?? raw.available ?? 0) : Number(raw ?? 0);
      balances.set(r.id, Number.isFinite(v) ? v : null);
    }));
    for (const r of rows) if (r.state === "live") r.available = balances.get(r.id) ?? null;

    return { sales, events: rows };
  });
