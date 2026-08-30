/**
 * Per-event payout ("fund request") page for organisers.
 *
 * Reads the payable balance via get_event_payable_balance, requires a saved
 * verified payout account, submits requests via create_fund_request and lists
 * this event's request history. Guarded directly by ProtectedRoute.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { notifyAdminFundRequest } from "@/lib/payouts.functions";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/fund-requests/$eventId")({
  head: () => ({
    meta: [
      { title: "Request Funds | AuraPass" },
      {
        name: "description",
        content: "Request payout of your event ticket sales revenue on AuraPass.",
      },
      { property: "og:title", content: "Request Funds | AuraPass" },
      {
        property: "og:description",
        content: "Request payout of your event ticket sales revenue on AuraPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <FundRequestsPage />
    </ProtectedRoute>
  ),
});

interface FundRequest {
  id: string;
  amount: number;
  status: string;
  admin_note: string | null;
  is_final_settlement: boolean;
  created_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
}

interface SavedAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

export function statusBadge(status: string) {
  switch (status) {
    case "approved":
      return { className: "bg-success-light text-success-strong", label: "Approved" };
    case "paid":
      return { className: "bg-success-light text-success-strong", label: "Paid" };
    case "pending":
      return { className: "bg-warning-light text-warning-strong", label: "Pending" };
    case "rejected":
      return {
        className: "bg-destructive-light text-destructive-strong",
        label: "Rejected",
      };
    default:
      return { className: "bg-accent text-foreground-secondary", label: status };
  }
}

function maskAccount(n: string) {
  return n.length > 4 ? `••••••${n.slice(-4)}` : n;
}

function fmtDate(v: string | null) {
  if (!v) return "";
  return new Date(v).toLocaleString();
}

function isEventConcluded(eventDate: string | null, eventTime: string | null) {
  if (!eventDate) return false;
  const date = new Date(eventDate);
  if (Number.isNaN(date.getTime())) return false;
  if (eventTime) {
    const [h, m] = eventTime.split(":").map(Number);
    if (typeof h === "number" && !Number.isNaN(h)) date.setHours(h, Number.isFinite(m) ? m : 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }
  return date.getTime() < Date.now();
}

function FundRequestsPage() {
  const { eventId } = Route.useParams();
  const { user, profile } = useAuth();
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<string | null>(null);
  const [eventTime, setEventTime] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [account, setAccount] = useState<SavedAccount | null>(null);
  const [requests, setRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const concluded = isEventConcluded(eventDate, eventTime);
  const requestsUsed = requests.filter(
    (r) => !r.is_final_settlement && ["pending", "approved", "paid"].includes(r.status),
  ).length;
  const requestsRemaining = Math.max(0, 2 - requestsUsed);
  const committed = requests
    .filter((r) => ["pending", "approved", "paid"].includes(r.status))
    .reduce((sum, r) => sum + r.amount, 0);

  const loadBalanceAndHistory = useCallback(async () => {
    const [balRes, histRes] = await Promise.all([
      (supabase as any).rpc("get_event_payable_balance", { p_event_id: eventId }),
      (supabase as any)
        .from("organiser_fund_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("requested_at", { ascending: false }),
    ]);

    const raw = Array.isArray(balRes.data) ? balRes.data[0] : balRes.data;
    const value =
      raw && typeof raw === "object"
        ? Number(
            (raw as Record<string, unknown>).payable_balance ??
              (raw as Record<string, unknown>).balance ??
              (raw as Record<string, unknown>).available ??
              0,
          )
        : Number(raw ?? 0);
    setBalance(Number.isFinite(value) ? value : 0);

    setRequests(
      ((histRes.data as any[]) ?? []).map((r) => ({
        id: r.id,
        amount: Number(r.amount ?? 0),
        status: String(r.status ?? "pending"),
        admin_note: r.admin_note ?? r.admin_notes ?? null,
        is_final_settlement: Boolean(r.is_final_settlement ?? false),
        created_at: r.requested_at ?? r.created_at ?? null,
        reviewed_at: r.reviewed_at ?? null,
        paid_at: r.paid_at ?? null,
      })),
    );
  }, [eventId]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data: evt }, { data: acct }] = await Promise.all([
        (supabase as any)
          .from("events")
          .select("title, event_date, event_time")
          .eq("id", eventId)
          .maybeSingle(),
        user?.id
          ? (supabase as any)
              .from("organiser_bank_accounts")
              .select("bank_name, account_number, account_name")
              .eq("organiser_id", user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);
      await loadBalanceAndHistory();
      if (!active) return;
      const event = evt as { title?: string; event_date?: string | null; event_time?: string | null } | null;
      setEventTitle(event?.title ?? "");
      setEventDate(event?.event_date ?? null);
      setEventTime(event?.event_time ?? null);
      setAccount((acct as SavedAccount | null) ?? null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [eventId, user?.id, loadBalanceAndHistory]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    if (value > balance) {
      setError("Requested amount exceeds available balance.");
      return;
    }
    setSubmitting(true);
    const { data: createdRows, error: rpcError } = await (supabase as any).rpc("create_fund_request", {
      p_event_id: eventId,
      p_amount: value,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message ?? "Could not submit the request.");
      return;
    }
    toast.success("Fund request submitted");
    setAmount("");

    // Notify admin fire-and-forget — don't block the UI on email delivery
    notifyAdminFundRequest({
      data: {
        eventTitle,
        organiserName: profile?.full_name ?? profile?.username ?? user?.email ?? "",
        organiserUsername: profile?.username ?? "",
        amountRequested: value,
        isFinalSettlement: false,
        fundRequestId: createdRows?.[0]?.id ?? "",
      },
    }).catch((err: unknown) => console.error("Failed to notify admin:", err));

    await loadBalanceAndHistory();
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Request Funds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {eventTitle
              ? `Payouts for “${eventTitle}”.`
              : "Request a payout of your ticket sales revenue."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/organiser/events" search={{ filter: "all" }}>Back to My Events</Link>
        </Button>
      </div>

      <Card className="p-6" style={{ borderRadius: 12 }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Banknote className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Withdrawn so far
              </p>
              <p className="text-2xl font-bold text-foreground">{formatNaira(committed)}</p>
            </div>
          </div>
          <div className="hidden h-10 w-px bg-border sm:block" />
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
              <Banknote className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Still available to request
              </p>
              <p className="text-2xl font-bold text-foreground">{formatNaira(balance)}</p>
            </div>
          </div>
        </div>
      </Card>

      {!account ? (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <p className="text-sm font-medium text-foreground">
            Add a verified payout account before requesting funds
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            We pay out to a bank account verified with Paystack. Add one in your settings.
          </p>
          <Button asChild variant="primary" size="sm" className="mt-4">
            <Link to="/dashboard/organiser/settings">Go to Settings</Link>
          </Button>
        </Card>
      ) : concluded ? (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <p className="text-sm font-medium text-foreground">Event concluded</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This event has concluded. Your remaining balance will be released as a final
            settlement automatically.
          </p>
        </Card>
      ) : (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <h2 className="text-lg font-semibold text-foreground">New request</h2>

          <div className="mt-3 rounded-lg border border-border bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Fund request policy</p>
            <p className="mt-1">
              You can request funds up to 2 times before your event, for a combined total of up
              to 80% of your available balance.
            </p>
            <p className="mt-1">
              The remaining balance is automatically released as a final settlement once your
              event concludes — no action needed from you.
            </p>
            <p className="mt-2 font-medium text-foreground">
              {requestsUsed} of 2 requests used{requestsRemaining === 0 ? " (no remaining requests)" : ""}
            </p>
          </div>

          <div className="mt-3 rounded-md border border-border bg-muted px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Paid into
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {account.account_name}
            </p>
            <p className="text-sm text-muted-foreground">
              {account.bank_name} · {maskAccount(account.account_number)}
            </p>
            <Link
              to="/dashboard/organiser/settings"
              className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
            >
              Change payout account
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              min={1}
              max={balance || undefined}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount to request"
              className="sm:max-w-xs"
              disabled={requestsRemaining === 0}
            />
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || balance <= 0 || requestsRemaining === 0}
            >
              {submitting ? "Submitting..." : "Request funds"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-destructive-strong">{error}</p>}
        </Card>
      )}

      <Card className="p-6" style={{ borderRadius: 12 }}>
        <h2 className="text-lg font-semibold text-foreground">Request history</h2>
        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No fund requests for this event yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((r) => {
              const s = statusBadge(r.status);
              return (
                <div
                  key={r.id}
                  className="rounded-lg border border-border px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {formatNaira(r.amount)}
                    </p>
                    <Badge className={s.className}>{s.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested {fmtDate(r.created_at)}
                    {r.reviewed_at ? ` · Reviewed ${fmtDate(r.reviewed_at)}` : ""}
                    {r.paid_at ? ` · Paid ${fmtDate(r.paid_at)}` : ""}
                  </p>
                  {r.status === "rejected" && r.admin_note && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-destructive-strong">
                      {r.admin_note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
