/**
 * Admin queue for organiser fund (payout) requests.
 *
 * Lists requests from get_admin_fund_requests(p_status), approves/rejects via
 * review_fund_request and records completed transfers with
 * mark_fund_request_paid.
 */
import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin/fund-requests")({
  head: () => ({
    meta: [
      { title: "Fund Requests | AuraPass Admin" },
      {
        name: "description",
        content: "Review and process organiser payout requests on AuraPass.",
      },
      { property: "og:title", content: "Fund Requests | AuraPass Admin" },
      {
        property: "og:description",
        content: "Review and process organiser payout requests on AuraPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminFundRequestsPage,
});

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "paid";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "paid", label: "Paid" },
];

interface AdminFundRequest {
  id: string;
  amount: number;
  status: string;
  admin_note: string | null;
  is_final_settlement: boolean;
  created_at: string | null;
  organiser_name: string;
  organiser_username: string | null;
  event_title: string;
  bank_name: string;
  account_number: string;
  account_name: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "approved":
    case "paid":
      return {
        className: "bg-success-light text-success-strong",
        label: status === "paid" ? "Paid" : "Approved",
      };
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

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleString() : "";
}

function AdminFundRequestsPage() {
  const [tab, setTab] = useState<StatusFilter>("pending");
  const [rows, setRows] = useState<AdminFundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [rejectTarget, setRejectTarget] = useState<AdminFundRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [payTarget, setPayTarget] = useState<AdminFundRequest | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_admin_fund_requests", {
      p_status: tab === "all" ? null : tab,
    });
    if (error) toast.error(error.message);
    setRows(
      error
        ? []
        : ((data as any[]) ?? []).map((r) => ({
            id: r.id ?? r.request_id,
            amount: Number(r.amount ?? 0),
            status: String(r.status ?? "pending"),
            admin_note: r.admin_note ?? r.admin_notes ?? null,
            is_final_settlement: Boolean(r.is_final_settlement ?? false),
            created_at: r.created_at ?? r.requested_at ?? null,
            organiser_name: r.organiser_full_name ?? r.full_name ?? "Unknown",
            organiser_username: r.organiser_username ?? r.username ?? null,
            event_title: r.event_title ?? r.title ?? "",
            bank_name: r.bank_name ?? "",
            account_number: r.account_number ?? "",
            account_name: r.account_name ?? "",
          })),
    );
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(row: AdminFundRequest) {
    setBusyId(row.id);
    const { error } = await (supabase as any).rpc("review_fund_request", {
      p_request_id: row.id,
      p_approve: true,
      p_admin_notes: null,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request approved");
    load();
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    setBusyId(rejectTarget.id);
    const { error } = await (supabase as any).rpc("review_fund_request", {
      p_request_id: rejectTarget.id,
      p_approve: false,
      p_admin_notes: rejectNote.trim() || null,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Request rejected");
    setRejectTarget(null);
    setRejectNote("");
    load();
  }

  async function confirmPaid() {
    if (!payTarget) return;
    const id = payTarget.id;
    setPayTarget(null);
    setBusyId(id);
    const { error } = await (supabase as any).rpc("mark_fund_request_paid", {
      p_request_id: id,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marked as paid");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Fund Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review organiser payout requests and record completed transfers.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <p className="text-muted-foreground">No fund requests in this view.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const s = statusBadge(r.status);
            return (
              <Card key={r.id} className="p-5" style={{ borderRadius: 12 }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">
                        {r.event_title || "Event"}
                      </h3>
                      <Badge className={s.className}>{s.label}</Badge>
                      {r.is_final_settlement && (
                        <Badge variant="secondary">Final Settlement</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.organiser_name}
                      {r.organiser_username ? ` (@${r.organiser_username})` : ""} ·
                      requested {fmtDate(r.created_at)}
                    </p>
                    <p className="mt-2 text-lg font-bold text-foreground">
                      {formatCurrency(r.amount)}
                    </p>
                    <div className="mt-2 rounded-md border border-border bg-muted px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Payout account
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {r.account_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {r.bank_name} · {r.account_number}
                      </p>
                    </div>
                    {r.admin_note && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {r.is_final_settlement ? r.admin_note : `Admin note: ${r.admin_note}`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {r.status === "pending" && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => approve(r)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busyId === r.id}
                          onClick={() => {
                            setRejectTarget(r);
                            setRejectNote("");
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={busyId === r.id}
                        onClick={() => setPayTarget(r)}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => {
          if (!open && busyId === null) {
            setRejectTarget(null);
            setRejectNote("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject fund request</DialogTitle>
            <DialogDescription>
              Optionally tell the organiser why this request was rejected.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={3}
            placeholder="Optional note (e.g. event has not ended yet)"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
              disabled={busyId !== null}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmReject}
              disabled={busyId !== null}
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!payTarget}
        onOpenChange={(open) => {
          if (!open) setPayTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this request as paid?</AlertDialogTitle>
            <AlertDialogDescription>
              {payTarget
                ? `Confirm you've completed this transfer of ${formatCurrency(
                    payTarget.amount,
                  )} to ${payTarget.account_name} (${payTarget.bank_name} · ${
                    payTarget.account_number
                  }). This cannot be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPaid}>
              Yes, transfer completed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
