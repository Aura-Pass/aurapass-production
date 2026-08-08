import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";
import { useOrganiserEvents } from "@/hooks/useOrganiserEvents";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/scan/")({
  head: () => ({ meta: [{ title: "Ticket Scanner | AuraPass" }] }),
  component: ScanIndexPage,
});

function ScanIndexPage() {
  const { user } = useAuth();
  const { events, loading } = useOrganiserEvents(user?.id);
  const scannable = events.filter((e) => e.status === "published" || e.status === "sold_out");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Ticket Scanner</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Pick an event to open the scanner and check attendees in.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : scannable.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <ScanLine className="mx-auto h-8 w-8 text-[#D1D5DB]" />
          <p className="mt-3 text-sm text-[#6B7280]">
            You have no published events to scan yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {scannable.map((e) => (
            <Card
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
              style={{ borderRadius: 12 }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">{e.title}</p>
                <p className="text-xs text-[#6B7280]">
                  {e.event_date ? formatDate(e.event_date) : ""}
                </p>
              </div>
              <Link
                to="/dashboard/organiser/scan/$eventId"
                params={{ eventId: e.id }}
                className="inline-flex items-center gap-2 rounded-md bg-[#D946EF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C026D3]"
              >
                <ScanLine className="h-4 w-4" />
                Open scanner
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
