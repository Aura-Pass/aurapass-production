/**
 * Per-event marketer (referral) management for organisers.
 *
 * Assign a marketer by username via assign_event_marketer, list current
 * marketers with performance stats from get_event_marketer_stats, and remove
 * them with unassign_event_marketer. Guarded directly by ProtectedRoute so it
 * does not rely on any parent-layout guard.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Copy, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/marketers/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Marketers | AuraPass" },
      {
        name: "description",
        content: "Assign marketers to your event and track referral sales on AuraPass.",
      },
      { property: "og:title", content: "Event Marketers | AuraPass" },
      {
        property: "og:description",
        content: "Assign marketers to your event and track referral sales on AuraPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <MarketersPage />
    </ProtectedRoute>
  ),
});

interface MarketerStat {
  event_marketer_id: string;
  marketer_user_id: string;
  username: string | null;
  full_name: string | null;
  referral_code: string;
  order_count: number;
  tickets_sold: number;
  gross_revenue: number;
}

function MarketersPage() {
  const { eventId } = Route.useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [eventSlug, setEventSlug] = useState("");
  const [username, setUsername] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [rows, setRows] = useState<MarketerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await (supabase as any).rpc("get_event_marketer_stats", {
      p_event_id: eventId,
    });
    setRows(
      error
        ? []
        : ((data as any[]) ?? []).map((r) => ({
            event_marketer_id: r.event_marketer_id,
            marketer_user_id: r.marketer_user_id,
            username: r.marketer_username,
            full_name: r.marketer_full_name,
            referral_code: r.referral_code,
            order_count: Number(r.confirmed_orders ?? 0),
            tickets_sold: Number(r.tickets_sold ?? 0),
            gross_revenue: Number(r.gross_revenue ?? 0),
          })),
    );
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("events")
        .select("title, slug")
        .eq("id", eventId)
        .maybeSingle();
      if (!active) return;
      setEventTitle((data as { title?: string } | null)?.title ?? "");
      setEventSlug((data as { slug?: string } | null)?.slug ?? "");
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  function referralLink(code: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/events/${eventSlug}?aref=${code}`;
  }

  async function copyLink(code: string) {
    try {
      await navigator.clipboard.writeText(referralLink(code));
      setCopied(code);
      toast.success("Referral link copied");
      setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
    } catch {
      toast.error("Could not copy the link");
    }
  }

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

  async function handleAssign(e: FormEvent) {
    e.preventDefault();
    const handle = username.trim().replace(/^@/, "");
    if (!handle) {
      toast.error("Enter a username");
      return;
    }
    setAssigning(true);
    const { data, error } = await (supabase as any).rpc("assign_event_marketer", {
      p_event_id: eventId,
      p_username: handle,
    });
    setAssigning(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    const code =
      typeof row === "string" ? row : (row?.referral_code as string | undefined) ?? "";
    toast.success(code ? `@${handle} added — code ${code}` : `@${handle} added as a marketer`);
    setUsername("");
    load();
  }

  async function handleRemove(eventMarketerId: string) {
    setBusyId(eventMarketerId);
    const { error } = await (supabase as any).rpc("unassign_event_marketer", {
      p_event_marketer_id: eventMarketerId,
    });
    setBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Marketer removed");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Marketers</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {eventTitle
              ? `People promoting “${eventTitle}” with a tracked referral link.`
              : "People promoting this event with a tracked referral link."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/organiser/events" search={{ filter: "all" }}>
            Back to events
          </Link>
        </Button>
      </div>

      <Card className="space-y-4 p-5" style={{ borderRadius: 12 }}>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleAssign}>
          <div className="min-w-[220px] flex-1">
            <label className="text-sm font-medium text-[#111827]" htmlFor="marketer-username">
              Assign a marketer
            </label>
            <Input
              id="marketer-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="mt-2"
            />
          </div>
          <Button type="submit" variant="primary" loading={assigning}>
            Assign
          </Button>
        </form>
        <p className="text-xs text-[#6B7280]">
          Each marketer gets a unique referral link. Orders placed through it are credited to them.
        </p>
      </Card>

      <Card className="p-5" style={{ borderRadius: 12 }}>
        <h2 className="text-sm font-semibold text-[#111827]">Assigned marketers</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center">
            <Megaphone className="mx-auto h-7 w-7 text-[#D1D5DB]" />
            <p className="mt-2 text-sm text-[#6B7280]">No marketers assigned yet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[#E5E7EB] rounded-md border border-[#E5E7EB]">
            {rows.map((r) => (
              <li key={r.event_marketer_id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#111827]">
                      {r.full_name || r.username || "Unknown"}
                    </p>
                    <p className="text-xs text-[#6B7280]">@{r.username ?? "user"}</p>
                    <p className="mt-1 break-all text-xs text-[#6B7280]">
                      {referralLink(r.referral_code)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-[#6B7280]">Code:</span>
                      <code className="rounded bg-[#F3F4F6] px-1.5 py-0.5 font-mono text-xs text-[#111827]">
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(r.referral_code)}
                      aria-label="Copy referral link"
                    >
                      {copied === r.referral_code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r.event_marketer_id}
                      onClick={() => remove(r.event_marketer_id)}
                      aria-label="Remove marketer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-[#F9FAFB] px-2 py-2">
                    <p className="text-sm font-semibold text-[#111827]">{r.order_count}</p>
                    <p className="text-[11px] text-[#6B7280]">Orders</p>
                  </div>
                  <div className="rounded-md bg-[#F9FAFB] px-2 py-2">
                    <p className="text-sm font-semibold text-[#111827]">{r.tickets_sold}</p>
                    <p className="text-[11px] text-[#6B7280]">Tickets</p>
                  </div>
                  <div className="rounded-md bg-[#F9FAFB] px-2 py-2">
                    <p className="text-sm font-semibold text-[#111827]">
                      {formatCurrency(r.gross_revenue)}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">Revenue</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
