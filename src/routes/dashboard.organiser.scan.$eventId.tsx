import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode as Html5QrcodeType } from "html5-qrcode";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useEventCheckInCount } from "@/hooks/useEventCheckInCount";
import { useEventTickets } from "@/hooks/useEventTickets";

export const Route = createFileRoute("/dashboard/organiser/scan/$eventId")({
  head: () => ({ meta: [{ title: "Ticket Scanner | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <ScanPage />
    </ProtectedRoute>
  ),
});

type ScanState =
  | { kind: "idle" }
  | { kind: "success"; message: string; sub?: string }
  | { kind: "error"; message: string; sub?: string };

const RESULT_HOLD_MS = 2500;

function ScanPage() {
  const { eventId } = Route.useParams();
  const [eventTitle, setEventTitle] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [admittingTicketId, setAdmittingTicketId] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [optimisticCheckedIn, setOptimisticCheckedIn] = useState<number | null>(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const { tickets, refetch: refetchTickets } = useEventTickets(eventId);

  const filteredTickets = tickets.filter(
    (t) =>
      ticketSearch === "" ||
      t.qr_code.toLowerCase().includes(ticketSearch.toLowerCase()) ||
      (t.order?.buyer_name ?? "").toLowerCase().includes(ticketSearch.toLowerCase()),
  );

  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const isProcessingRef = useRef(false);
  const lastCodeRef = useRef<string | null>(null);
  const containerId = "qr-reader";

  const { checkedIn, total } = useEventCheckInCount(eventId, refreshKey);
  const visibleCheckedIn = optimisticCheckedIn ?? checkedIn;

  useEffect(() => {
    if (optimisticCheckedIn !== null && checkedIn >= optimisticCheckedIn) {
      setOptimisticCheckedIn(null);
    }
  }, [checkedIn, optimisticCheckedIn]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      const t = data?.title ?? "";
      setEventTitle(t);
      if (typeof document !== "undefined" && t) {
        document.title = `Ticket Scanner — ${t} | AuraPass`;
      }
    })();
  }, [eventId]);

  // Scanner lifecycle — dynamic import so SSR doesn't touch navigator.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    let scanner: Html5QrcodeType | null = null;

    (async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;
      scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // eslint-disable-next-line no-console
            console.log("[scanner] decoded:", decodedText);
            if (isProcessingRef.current) return;
            if (lastCodeRef.current === decodedText) return;
            isProcessingRef.current = true;
            lastCodeRef.current = decodedText;

            // Pause the camera immediately so we don't spam frames.
            try {
              scanner?.pause(true);
            } catch (e) {
              console.warn("[scanner] pause failed", e);
            }
            void handleScan(decodedText);
          },
          () => {
            /* per-frame "no QR found" — ignore */
          },
        );
        console.log("[scanner] started");
      } catch (err: any) {
        console.error("[scanner] start failed", err);
        setCameraError(err?.message ?? "Allow camera access and reload.");
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        s.stop().then(() => s.clear()).catch(() => {});
      }
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function handleScan(code: string) {
    try {
      const result = await processCode(code);
      console.log("[scanner] result:", result);
      setScanState(result);
      if (result.kind === "success") {
        markSuccessfulCheckIn();
        setRefreshKey((k) => k + 1);
        void refetchTickets();
      }
    } catch (err: any) {
      console.error("[scanner] processCode threw:", err);
      setScanState({
        kind: "error",
        message: "Scan failed",
        sub: err?.message ?? String(err),
      });
    } finally {
      window.setTimeout(() => {
        setScanState({ kind: "idle" });
        isProcessingRef.current = false;
        lastCodeRef.current = null;
        const s = scannerRef.current;
        if (s) {
          try {
            s.resume();
          } catch (e) {
            console.warn("[scanner] resume failed", e);
          }
        }
      }, RESULT_HOLD_MS);
    }
  }

  async function processCode(code: string): Promise<ScanState> {
    const { data: ticket, error: qErr } = await (supabase as any)
      .from("tickets")
      .select("id, status, event_id, checked_in_at, ticket_type:ticket_types(name)")
      .eq("qr_code", code)
      .maybeSingle();

    if (qErr) {
      console.error("[scanner] ticket lookup error:", qErr);
      return { kind: "error", message: "Lookup failed", sub: qErr.message };
    }
    if (!ticket) {
      return { kind: "error", message: "Invalid ticket", sub: "QR not found in database" };
    }

    return validateAndAdmitTicket(ticket, "scan");
  }

  function markSuccessfulCheckIn() {
    setOptimisticCheckedIn((current) => Math.min((current ?? checkedIn) + 1, total || Infinity));
  }

  async function validateAndAdmitTicket(ticket: any, source: "scan" | "manual"): Promise<ScanState> {
    if (ticket.event_id !== eventId) {
      return { kind: "error", message: "Wrong event", sub: "This ticket is for a different event" };
    }
    if (ticket.status === "used") {
      const when = ticket.checked_in_at
        ? new Date(ticket.checked_in_at).toLocaleString()
        : "previously";
      return { kind: "error", message: "Already checked in", sub: `Scanned ${when}` };
    }
    if (ticket.status === "voided") {
      return { kind: "error", message: "Ticket voided" };
    }

    return admitTicket(ticket, source);
  }

  async function admitTicket(ticket: any, source: "scan" | "manual"): Promise<ScanState> {
    const checkedInAt = new Date().toISOString();

    console.log(`[scanner] ${source} update request:`, {
      ticketId: ticket.id,
      eventId: ticket.event_id,
      previousStatus: ticket.status,
      checkedInAt,
    });

    const { data: updatedTicket, error } = await (supabase as any)
      .from("tickets")
      .update({ status: "used", checked_in_at: checkedInAt })
      .eq("id", ticket.id)
      .eq("status", "valid")
      .select("id, status, checked_in_at")
      .maybeSingle();

    console.log(`[scanner] ${source} update response:`, { data: updatedTicket, error });

    if (error) {
      console.error(`[scanner] ${source} update failed:`, error);
      return { kind: "error", message: "Check-in failed", sub: error.message };
    }

    if (!updatedTicket) {
      const { data: latest, error: latestError } = await (supabase as any)
        .from("tickets")
        .select("id, status, checked_in_at")
        .eq("id", ticket.id)
        .maybeSingle();

      console.warn(`[scanner] ${source} update affected no rows:`, { latest, latestError });

      if (latest?.status === "used") {
        const when = latest.checked_in_at
          ? new Date(latest.checked_in_at).toLocaleString()
          : "previously";
        return { kind: "error", message: "Already checked in", sub: `Scanned ${when}` };
      }

      return {
        kind: "error",
        message: "Check-in not saved",
        sub: latestError?.message ?? "No ticket row was updated. Check the tickets UPDATE grant/RLS policy.",
      };
    }

    const { data: verified, error: verifyError } = await (supabase as any)
      .from("tickets")
      .select("id, status, checked_in_at")
      .eq("id", ticket.id)
      .maybeSingle();

    console.log(`[scanner] ${source} verification response:`, { data: verified, error: verifyError });

    if (verifyError) {
      console.error(`[scanner] ${source} verification failed:`, verifyError);
      return { kind: "error", message: "Check-in verify failed", sub: verifyError.message };
    }

    if (verified?.status !== "used") {
      console.error(`[scanner] ${source} update did not persist:`, { verified });
      return {
        kind: "error",
        message: "Check-in not saved",
        sub: "Database did not keep the ticket status as used.",
      };
    }

    return {
      kind: "success",
      message: "Admitted",
      sub: ticket.ticket_type?.name ?? "Ticket",
    };
  }

  function dismissResult() {
    setScanState({ kind: "idle" });
    isProcessingRef.current = false;
    lastCodeRef.current = null;
    const s = scannerRef.current;
    if (s) {
      try {
        s.resume();
      } catch {}
    }
  }

  async function runManualSearch() {
    if (!searchTerm.trim()) return;
    setSearching(true);
    const term = `%${searchTerm.trim()}%`;
    const { data: orders, error: ordersError } = await (supabase as any)
      .from("orders")
      .select("id, buyer_name, buyer_email")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .or(`buyer_name.ilike.${term},buyer_email.ilike.${term}`);

    if (ordersError) {
      console.error("[scanner] manual search orders error:", ordersError);
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    const { data: tickets, error: ticketsError } = await (supabase as any)
      .from("tickets")
      .select("id, status, event_id, checked_in_at, order_id, ticket_type:ticket_types(name)")
      .in("order_id", orderIds);

    if (ticketsError) {
      console.error("[scanner] manual search tickets error:", ticketsError);
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const byOrder = new Map<string, any>((orders ?? []).map((o: any) => [o.id, o]));
    const merged = (tickets ?? []).map((t: any) => ({ ...t, order: byOrder.get(t.order_id) }));
    setSearchResults(merged);
    setSearching(false);
  }

  async function manualAdmit(ticketId: string) {
    setAdmittingTicketId(ticketId);
    try {
      const { data: ticket, error: lookupError } = await (supabase as any)
        .from("tickets")
        .select("id, status, event_id, checked_in_at, ticket_type:ticket_types(name)")
        .eq("id", ticketId)
        .maybeSingle();

      console.log("[scanner] manual lookup response:", { data: ticket, error: lookupError });

      if (lookupError) {
        console.error("[scanner] manual lookup failed:", lookupError);
        setScanState({ kind: "error", message: "Lookup failed", sub: lookupError.message });
        return;
      }

      if (!ticket) {
        setScanState({ kind: "error", message: "Invalid ticket", sub: "Ticket not found" });
        return;
      }

      const result = await validateAndAdmitTicket(ticket, "manual");
      console.log("[scanner] manual admit result:", result);
      setScanState(result);

      if (result.kind === "success") {
        markSuccessfulCheckIn();
        setRefreshKey((k) => k + 1);
        setSearchResults((current) =>
          current.map((item) =>
            item.id === ticketId
              ? { ...item, status: "used", checked_in_at: new Date().toISOString() }
              : item,
          ),
        );
        void runManualSearch();
      }
    } catch (err: any) {
      console.error("[scanner] manual admit threw:", err);
      setScanState({ kind: "error", message: "Check-in failed", sub: err?.message ?? String(err) });
    } finally {
      setAdmittingTicketId(null);
    }
  }

  const isSuccess = scanState.kind === "success";
  const isError = scanState.kind === "error";
  const showOverlay = isSuccess || isError;

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-[#6B7280]">Scanning</p>
              <h1 className="truncate text-xl font-bold text-[#111827] md:text-2xl">
                {eventTitle || "Event"}
              </h1>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/dashboard/organiser">Back</Link>
            </Button>
          </div>

          <Card className="mt-4 p-4" style={{ borderRadius: 12 }}>
            <p className="text-sm text-[#6B7280]">
              <span className="font-semibold text-[#111827]">{visibleCheckedIn}</span> checked in /{" "}
              <span className="font-semibold text-[#111827]">{total}</span> total tickets
            </p>
          </Card>

          <Card className="mt-4 overflow-hidden relative" style={{ borderRadius: 12 }}>
            <div
              id={containerId}
              className="aspect-square w-full bg-black"
              style={{ minHeight: 280 }}
            />

            {/* Full-card overlay for scan results — impossible to miss */}
            {showOverlay && (
              <button
                type="button"
                onClick={dismissResult}
                className={`absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center transition-opacity ${
                  isSuccess ? "bg-[#047857]/95 text-white" : "bg-[#B91C1C]/95 text-white"
                }`}
              >
                <div className="text-5xl" aria-hidden>
                  {isSuccess ? "✓" : "✕"}
                </div>
                <div className="text-2xl font-bold">{scanState.message}</div>
                {"sub" in scanState && scanState.sub ? (
                  <div className="text-sm opacity-90">{scanState.sub}</div>
                ) : null}
                <div className="mt-2 text-xs uppercase tracking-wide opacity-80">
                  Tap to scan next
                </div>
              </button>
            )}

            {!showOverlay && (
              <div className="p-4 text-center text-sm font-medium text-[#6B7280] bg-white">
                {cameraError ? (
                  <span className="text-[#B91C1C]">Camera: {cameraError}</span>
                ) : (
                  "Point camera at a ticket QR code"
                )}
              </div>
            )}
          </Card>

          <Card className="mt-6 p-4" style={{ borderRadius: 12 }}>
            <h2 className="text-sm font-semibold text-[#111827]">Or search by name/email</h2>
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Buyer name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runManualSearch()}
              />
              <Button onClick={runManualSearch} loading={searching}>
                Search
              </Button>
            </div>
            {searchResults.length > 0 ? (
              <div className="mt-3 space-y-2">
                {searchResults.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-md border border-[#E5E7EB] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111827]">
                        {t.order?.buyer_name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-[#6B7280]">
                        {t.order?.buyer_email} · {t.ticket_type?.name}
                      </p>
                    </div>
                    {t.status === "used" ? (
                      <span className="text-xs font-semibold text-[#B91C1C]">Checked in</span>
                    ) : t.status === "voided" ? (
                      <span className="text-xs font-semibold text-[#6B7280]">Voided</span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => manualAdmit(t.id)}
                        loading={admittingTicketId === t.id}
                      >
                        Admit
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : searchTerm && !searching ? (
              <p className="mt-3 text-xs text-[#6B7280]">No matching tickets.</p>
            ) : null}
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}
