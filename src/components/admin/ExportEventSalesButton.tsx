import { supabase } from "@/lib/supabase";
import { Download } from "lucide-react";
import { useState } from "react";

export function ExportEventSalesButton({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    const { data, error } = await (supabase as any)
      .from("orders")
      .select(
        `id, buyer_name, buyer_email, buyer_phone,
         quantity, ticket_price, platform_fee, total_amount,
         status, created_at,
         ticket_types ( name ),
         tickets ( status, checked_in_at )`,
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      setExporting(false);
      return;
    }

    const headers = [
      "Order ID",
      "Buyer Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Quantity",
      "Ticket Price (₦)",
      "Platform Fee (₦)",
      "Total Paid (₦)",
      "Status",
      "Order Date",
      "Checked In",
      "Checked In At",
    ];

    const rows = (data as any[]).map((o) => {
      const tickets = o.tickets ?? [];
      const checkedIn = tickets.filter((t: any) => t.status === "used").length;
      const checkedInAt = tickets
        .filter((t: any) => t.checked_in_at)
        .map((t: any) => new Date(t.checked_in_at).toLocaleString("en-NG"))
        .join("; ");

      return [
        o.id,
        o.buyer_name,
        o.buyer_email,
        o.buyer_phone,
        o.ticket_types?.name ?? "",
        o.quantity,
        o.ticket_price,
        o.platform_fee,
        o.total_amount,
        o.status,
        new Date(o.created_at).toLocaleString("en-NG"),
        `${checkedIn}/${o.quantity}`,
        checkedInAt,
      ];
    });

    const confirmed = (data as any[]).filter((o) => o.status === "confirmed");
    const totalQty = confirmed.reduce((s, o) => s + Number(o.quantity ?? 0), 0);
    const totalTicketRevenue = confirmed.reduce(
      (s, o) => s + Number(o.ticket_price ?? 0) * Number(o.quantity ?? 0),
      0,
    );
    const totalFees = confirmed.reduce((s, o) => s + Number(o.platform_fee ?? 0), 0);
    const totalPaid = confirmed.reduce((s, o) => s + Number(o.total_amount ?? 0), 0);
    const totalCheckedIn = confirmed.reduce(
      (s, o) =>
        s + (o.tickets ?? []).filter((t: any) => t.status === "used").length,
      0,
    );

    const totalsRow = [
      "TOTALS (confirmed only)",
      "",
      "",
      "",
      "",
      totalQty,
      totalTicketRevenue,
      totalFees,
      totalPaid,
      "",
      "",
      `${totalCheckedIn}/${totalQty}`,
      "",
    ];

    const csv = [headers, ...rows, totalsRow]
      .map((r) =>
        r.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventTitle.toLowerCase().replace(/\s+/g, "-")}-sales-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#6B7280] hover:border-[#D946EF] hover:text-[#D946EF] transition-colors disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" />
      {exporting ? "Exporting..." : "Export Sales"}
    </button>
  );
}
