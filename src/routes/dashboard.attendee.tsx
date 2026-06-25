import { useMemo, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutDashboard, Ticket, Heart, Settings, Calendar, MapPin, Download, ImageIcon } from "lucide-react";
import QRCode from "qrcode";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TicketQRCode } from "@/components/ui/TicketQRCode";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets, type MyTicket } from "@/hooks/useMyTickets";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/attendee")({
  head: () => ({ meta: [{ title: "Dashboard — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeDashboard />
    </ProtectedRoute>
  ),
});

const NAV = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Tickets", icon: Ticket },
  { label: "Saved Events", icon: Heart },
  { label: "Settings", icon: Settings },
];

function AttendeeDashboard() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tickets.filter((t) => {
      if (!t.event?.event_date) return false;
      return new Date(t.event.event_date) >= today;
    }).length;
  }, [tickets]);

  // Group tickets by order+event
  const groups = useMemo(() => {
    const map = new Map<string, { order: MyTicket["order"]; event: MyTicket["event"]; tickets: MyTicket[] }>();
    for (const t of tickets) {
      const key = `${t.order?.id ?? "x"}-${t.event?.id ?? "x"}`;
      if (!map.has(key)) map.set(key, { order: t.order, event: t.event, tickets: [] });
      map.get(key)!.tickets.push(t);
    }
    return Array.from(map.values());
  }, [tickets]);

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-20 md:self-start">
              <Card className="p-2" style={{ borderRadius: 12 }}>
                <nav className="flex flex-col gap-1">
                  {NAV.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.label}
                        type="button"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#FDF4FF] hover:text-[#D946EF]"
                      >
                        <Icon className="h-4 w-4" />
                        {n.label}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            <section className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                  Welcome back, {profile?.full_name || "there"}
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Here's a snapshot of your activity on AuraPass.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="My Tickets" value={loading ? "—" : String(tickets.length)} />
                <Stat label="Saved Events" value="0" />
                <Stat label="Upcoming Events" value={loading ? "—" : String(upcomingCount)} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#111827]">My Tickets</h2>
                <p className="mt-1 text-sm text-[#6B7280]">All your purchased tickets, grouped by event.</p>

                <div className="mt-4">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : groups.length === 0 ? (
                    <Card className="p-8 text-center" style={{ borderRadius: 12 }}>
                      <Ticket className="mx-auto h-10 w-10 text-[#D1D5DB]" />
                      <p className="mt-3 text-sm text-[#6B7280]">You haven't booked any events yet</p>
                      <div className="mt-4">
                        <Button asChild variant="primary">
                          <Link to="/events">Discover Events</Link>
                        </Button>
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-5">
                      {groups.map((g, i) => (
                        <EventTicketGroup key={i} group={g} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
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

function EventTicketGroup({
  group,
}: {
  group: { order: MyTicket["order"]; event: MyTicket["event"]; tickets: MyTicket[] };
}) {
  const { event, tickets } = group;
  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <div className="flex flex-col gap-4 border-b border-[#E5E7EB] p-5 sm:flex-row">
        <div className="h-24 w-full overflow-hidden rounded-lg bg-[#F3F4F6] sm:w-40 shrink-0 flex items-center justify-center">
          {event?.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-8 w-8 text-[#D1D5DB]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#111827] truncate">{event?.title ?? "Event"}</h3>
          <div className="mt-2 flex flex-col gap-1 text-sm text-[#6B7280]">
            {event?.event_date && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {formatDate(event.event_date)}
                {event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}
              </span>
            )}
            {(event?.venue || event?.city) && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {[event.venue, event.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        {tickets.map((t, idx) => (
          <TicketTile key={t.id} ticket={t} index={idx} total={tickets.length} />
        ))}
      </div>
    </Card>
  );
}

function TicketTile({ ticket, index, total }: { ticket: MyTicket; index: number; total: number }) {
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const used = !!ticket.checked_in_at || ticket.status === "used";

  async function handleDownload() {
    const dataUrl = await QRCode.toDataURL(ticket.qr_code, { width: 600, margin: 2 });
    const a = downloadRef.current;
    if (!a) return;
    a.href = dataUrl;
    a.download = `${ticket.qr_code}.png`;
    a.click();
  }

  return (
    <div className="flex flex-col items-center rounded-xl border border-[#E5E7EB] bg-white p-4">
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-medium text-[#6B7280]">
          {ticket.ticket_type?.name ?? "Ticket"} · {index + 1}/{total}
        </span>
        {ticket.status === "voided" ? (
          <Badge variant="sold-out">Voided</Badge>
        ) : used ? (
          <Badge variant="outline">Used</Badge>
        ) : (
          <Badge variant="success">Valid</Badge>
        )}
      </div>
      <div className="mt-3">
        <TicketQRCode value={ticket.qr_code} size={160} />
      </div>
      <p className="mt-2 break-all text-center font-mono text-[10px] text-[#6B7280]">{ticket.qr_code}</p>
      <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        Download QR
      </Button>
      <a ref={downloadRef} className="hidden" />
    </div>
  );
}
