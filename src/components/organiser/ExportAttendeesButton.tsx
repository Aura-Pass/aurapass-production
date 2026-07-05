import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface Props {
  eventId: string;
  eventTitle: string;
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "event";
}

export function ExportAttendeesButton({ eventId, eventTitle }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setBusy(true);
    try {
      const { data: orders, error } = await (supabase as any)
        .from("orders")
        .select(
          `id, buyer_name, buyer_email, buyer_phone, quantity, total_amount, created_at, status,
           ticket_types ( name ),
           tickets ( checked_in, checked_in_at )`,
        )
        .eq("event_id", eventId)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = (orders ?? []).map((o: any) => {
        const tickets = Array.isArray(o.tickets) ? o.tickets : [];
        const totalTickets = tickets.length || o.quantity || 0;
        const checkedIn = tickets.filter((t: any) => t.checked_in).length;
        const lastCheckin = tickets
          .map((t: any) => t.checked_in_at)
          .filter(Boolean)
          .sort()
          .pop();
        let status: string;
        if (totalTickets === 0) status = "Not checked in";
        else if (checkedIn === 0) status = "Not checked in";
        else if (checkedIn >= totalTickets) status = "Checked in";
        else status = `Partial (${checkedIn}/${totalTickets})`;

        return [
          o.buyer_name ?? "",
          o.buyer_email ?? "",
          o.buyer_phone ?? "",
          o.ticket_types?.name ?? "",
          o.quantity ?? 0,
          o.total_amount ?? 0,
          o.created_at ? new Date(o.created_at).toISOString() : "",
          status,
          lastCheckin ? new Date(lastCheckin).toISOString() : "",
        ];
      });

      const header = [
        "Attendee Name",
        "Email",
        "Phone",
        "Ticket Type",
        "Quantity",
        "Amount Paid",
        "Order Date",
        "Check-in Status",
        "Checked In At",
      ];

      const csv =
        [header, ...rows]
          .map((cols) => cols.map(csvEscape).join(","))
          .join("\r\n") + "\r\n";

      const date = new Date().toISOString().slice(0, 10);
      const filename = `${slugify(eventTitle)}-attendees-${date}.csv`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(
        rows.length
          ? `Exported ${rows.length} attendee${rows.length === 1 ? "" : "s"}`
          : "Exported empty attendee list",
      );
    } catch (err: any) {
      toast.error(err?.message || "Could not export attendees");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={busy}
    >
      <Download className="mr-2 h-4 w-4" />
      {busy ? "Exporting…" : "Export Attendees"}
    </Button>
  );
}
