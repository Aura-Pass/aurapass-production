import { useMemo, useRef, useState } from "react";
import { Calendar, MapPin, Download, ImageIcon, ChevronDown, Ticket as TicketIcon } from "lucide-react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { TicketQRCode } from "@/components/ui/TicketQRCode";
import { formatDate } from "@/lib/utils";
import type { MyTicket } from "@/hooks/useMyTickets";
import { cn } from "@/lib/utils";

interface Props {
  tickets: MyTicket[];
  loading: boolean;
  emptyCta?: React.ReactNode;
}

export function MyTicketsList({ tickets, loading, emptyCta }: Props) {
  const groups = useMemo(() => {
    const map = new Map<string, { event: MyTicket["event"]; tickets: MyTicket[] }>();
    for (const t of tickets) {
      const key = t.event?.id ?? "x";
      if (!map.has(key)) map.set(key, { event: t.event, tickets: [] });
      map.get(key)!.tickets.push(t);
    }
    return Array.from(map.values());
  }, [tickets]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <Card className="p-8 text-center" style={{ borderRadius: 12 }}>
        <TicketIcon className="mx-auto h-10 w-10 text-[#D1D5DB]" />
        <p className="mt-3 text-sm text-[#6B7280]">You haven't booked any events yet</p>
        {emptyCta ? <div className="mt-4">{emptyCta}</div> : null}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <EventTicketGroup key={g.event?.id ?? Math.random()} group={g} />
      ))}
    </div>
  );
}

function EventTicketGroup({ group }: { group: { event: MyTicket["event"]; tickets: MyTicket[] } }) {
  const { event, tickets } = group;
  const [open, setOpen] = useState(false);
  const count = tickets.length;

  return (
    <Card className="overflow-hidden" style={{ borderRadius: 12 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-[#FAFAFA]"
        aria-expanded={open}
      >
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F3F4F6] flex items-center justify-center">
          {event?.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-[#D1D5DB]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[#111827]">{event?.title ?? "Event"}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#6B7280]">
            {event?.event_date && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(event.event_date)}
              </span>
            )}
            {(event?.venue || event?.city) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {[event?.venue, event?.city].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline">{count} {count === 1 ? "ticket" : "tickets"}</Badge>
          <ChevronDown
            className={cn("h-4 w-4 text-[#6B7280] transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="grid gap-4 border-t border-[#E5E7EB] bg-[#FAFAFA] p-5 sm:grid-cols-2">
          {tickets.map((t, idx) => (
            <TicketTile key={t.id} ticket={t} index={idx} total={tickets.length} />
          ))}
        </div>
      )}
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
