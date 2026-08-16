import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/gate/scan/")({
  head: () => ({ meta: [{ title: "My Assigned Events | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["gate_attendant", "organiser", "admin"]}>
      <GateScanIndexPage />
    </ProtectedRoute>
  ),
});

interface AssignedEvent {
  id: string;
  title: string;
  event_date: string | null;
  venue: string | null;
}

function GateScanIndexPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<AssignedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await (supabase as any)
        .from("event_gate_attendants")
        .select("event_id, events(id, title, event_date, venue)")
        .eq("attendant_user_id", user.id)
        .eq("status", "active");

      if (!active) return;
      if (error) {
        setEvents([]);
      } else {
        const rows = ((data as any[]) ?? [])
          .map((r) => (Array.isArray(r.events) ? r.events[0] : r.events))
          .filter(Boolean) as AssignedEvent[];
        setEvents(rows);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Assigned Events</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Events you've been assigned to as a gate attendant.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : events.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <ScanLine className="mx-auto h-8 w-8 text-[#D1D5DB]" />
          <p className="mt-3 text-sm text-[#6B7280]">
            You haven't been assigned to any events yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Card
              key={e.id}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
              style={{ borderRadius: 12 }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#111827]">{e.title}</p>
                <p className="text-xs text-[#6B7280]">
                  {e.event_date ? formatDate(e.event_date) : ""}
                  {e.venue ? ` · ${e.venue}` : ""}
                </p>
              </div>
              <Link
                to="/dashboard/organiser/scan/$eventId"
                params={{ eventId: e.id }}
                className="inline-flex items-center gap-2 rounded-md bg-[#D946EF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C026D3]"
              >
                <ScanLine className="h-4 w-4" />
                Open Scanner
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
