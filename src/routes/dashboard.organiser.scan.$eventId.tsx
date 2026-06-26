import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { useEventCheckInCount } from "@/hooks/useEventCheckInCount";

export const Route = createFileRoute("/dashboard/organiser/scan/$eventId")({
  head: () => ({ meta: [{ title: "Scan Tickets — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <ScanPage />
    </ProtectedRoute>
  ),
});

type ScanState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; sub?: string };

function ScanPage() {
  const { eventId } = Route.useParams();
  const [eventTitle, setEventTitle] = useState<string>("");
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const containerId = "qr-reader";

  const { checkedIn, total } = useEventCheckInCount(eventId, refreshKey);

  // Load event title
  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      setEventTitle(data?.title ?? "");
    })();
  }, [eventId]);

  // Scanner lifecycle
  useEffect(() => {
    if (!scannerActive) return;

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (isProcessingRef.current) return;
          isProcessingRef.current = true;
          handleScan(decodedText);
        },
        () => {
          /* ignore scan failures (frame had no QR) */
        },
      )
      .catch((err) => {
        setScanState({
          kind: "error",
          message: "Camera unavailable",
          sub: err?.message ?? "Allow camera access and reload.",
        });
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
      scannerRef.current = null;
    };
  }, [scannerActive, eventId]);

  async function handleScan(code: string) {
    const result = await processCode(code);
    setScanState(result);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setScanState({ kind: "idle" });
      isProcessingRef.current = false;
    }, 2000);
  }

  async function processCode(code: string): Promise<ScanState> {
    const { data: ticket } = await (supabase as any)
      .from("tickets")
      .select("id, status, event_id, checked_in_at, ticket_type:ticket_types(name)")
      .eq("qr_code", code)
      .maybeSingle();

    if (!ticket) {
      return { kind: "error", message: "Invalid ticket — not found" };
    }
    if (ticket.event_id !== eventId) {
      return { kind: "error", message: "This ticket is for a different event" };
    }
    if (ticket.status === "used") {
      const when = ticket.checked_in_at
        ? new Date(ticket.checked_in_at).toLocaleString()
        : "previously";
      return { kind: "error", message: "Already checked in", sub: `Scanned at ${when}` };
    }
    if (ticket.status === "voided") {
      return { kind: "error", message: "Ticket voided" };
    }

    const { error } = await (supabase as any)
      .from("tickets")
      .update({ status: "used", checked_in_at: new Date().toISOString() })
      .eq("id", ticket.id)
      .eq("status", "valid");

    if (error) {
      return { kind: "error", message: "Check-in failed", sub: error.message };
    }
    return {
      kind: "success",
      message: `✅ Admitted — ${ticket.ticket_type?.name ?? "Ticket"}`,
    };
  }

  async function runManualSearch() {
    if (!searchTerm.trim()) return;
    setSearching(true);
    const term = `%${searchTerm.trim()}%`;
    const { data: orders } = await (supabase as any)
      .from("orders")
      .select("id, buyer_name, buyer_email")
      .eq("event_id", eventId)
      .eq("status", "confirmed")
      .or(`buyer_name.ilike.${term},buyer_email.ilike.${term}`);

    const orderIds = (orders ?? []).map((o: any) => o.id);
    if (orderIds.length === 0) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const { data: tickets } = await (supabase as any)
      .from("tickets")
      .select("id, status, checked_in_at, order_id, ticket_type:ticket_types(name)")
      .in("order_id", orderIds);

    const byOrder = new Map<string, any>((orders ?? []).map((o: any) => [o.id, o]));
    const merged = (tickets ?? []).map((t: any) => ({
      ...t,
      order: byOrder.get(t.order_id),
    }));
    setSearchResults(merged);
    setSearching(false);
  }

  async function manualAdmit(ticketId: string) {
    const { error } = await (supabase as any)
      .from("tickets")
      .update({ status: "used", checked_in_at: new Date().toISOString() })
      .eq("id", ticketId)
      .eq("status", "valid");
    if (!error) {
      setRefreshKey((k) => k + 1);
      runManualSearch();
    }
  }

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
              <span className="font-semibold text-[#111827]">{checkedIn}</span> checked in /{" "}
              <span className="font-semibold text-[#111827]">{total}</span> total tickets
            </p>
          </Card>

          <Card className="mt-4 overflow-hidden" style={{ borderRadius: 12 }}>
            <div
              id={containerId}
              className="aspect-square w-full bg-black"
              style={{ minHeight: 280 }}
            />
            <div
              className={`p-4 text-center font-semibold transition-colors ${
                scanState.kind === "success"
                  ? "bg-[#ECFDF5] text-[#047857]"
                  : scanState.kind === "error"
                    ? "bg-[#FEE2E2] text-[#B91C1C] animate-pulse"
                    : "bg-white text-[#6B7280]"
              }`}
            >
              {scanState.kind === "idle"
                ? "Point camera at a ticket QR code"
                : scanState.message}
              {scanState.kind !== "idle" && "sub" in scanState && scanState.sub ? (
                <p className="mt-1 text-xs font-normal opacity-80">{scanState.sub}</p>
              ) : null}
            </div>
          </Card>

          <Card className="mt-6 p-4" style={{ borderRadius: 12 }}>
            <h2 className="text-sm font-semibold text-[#111827]">
              Or search by name/email
            </h2>
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
                      <span className="text-xs font-semibold text-[#B91C1C]">
                        Checked in
                      </span>
                    ) : t.status === "voided" ? (
                      <span className="text-xs font-semibold text-[#6B7280]">Voided</span>
                    ) : (
                      <Button size="sm" onClick={() => manualAdmit(t.id)}>
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
