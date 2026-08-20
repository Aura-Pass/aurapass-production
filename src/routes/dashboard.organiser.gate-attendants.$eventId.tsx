import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/dashboard/organiser/gate-attendants/$eventId")({
  head: () => ({ meta: [{ title: "Gate Attendants | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <GateAttendantsPage />
    </ProtectedRoute>
  ),
});

interface SearchResult {
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

interface Assignment {
  id: string;
  attendant_user_id: string;
  username: string | null;
  avatar_url: string | null;
}

function GateAttendantsPage() {
  const { eventId } = Route.useParams();
  const [eventTitle, setEventTitle] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadAssignments = useCallback(async () => {
    const { data, error } = await (supabase as any)
      .rpc("get_event_gate_attendants", { p_event_id: eventId });

    if (error) {
      setAssignments([]);
    } else {
      setAssignments(
        ((data as any[]) ?? []).map((r) => ({
          id: r.id,
          attendant_user_id: r.attendant_user_id,
          username: r.username,
          avatar_url: r.avatar_url,
        })),
      );
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("events")
        .select("title")
        .eq("id", eventId)
        .maybeSingle();
      if (active) setEventTitle((data as { title?: string } | null)?.title ?? "");
    })();
    return () => {
      active = false;
    };
  }, [eventId]);

  // Debounced user search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    const t = setTimeout(async () => {
      const { data, error } = await (supabase as any).rpc("search_users_for_gate_invite", {
        p_query: q,
      });
      if (!active) return;
      setResults(error ? [] : ((data as SearchResult[] | null) ?? []));
      setSearching(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [query]);

  async function invite(result: SearchResult) {
    setBusyId(result.user_id);
    const { error } = await (supabase as any)
      .from("event_gate_attendants")
      .upsert(
        { event_id: eventId, attendant_user_id: result.user_id, status: "active", revoked_at: null },
        { onConflict: "event_id,attendant_user_id" },
      );
    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`@${result.username ?? "user"} added as a gate attendant`);
    setQuery("");
    setResults([]);
    loadAssignments();
  }

  async function revoke(assignmentId: string) {
    setBusyId(assignmentId);
    const { error } = await (supabase as any)
      .from("event_gate_attendants")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", assignmentId);
    setBusyId(null);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Gate attendant revoked");
    loadAssignments();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Gate Attendants</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            {eventTitle
              ? `People who can scan tickets for “${eventTitle}”.`
              : "People who can scan tickets for this event."}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/organiser/events" search={{ filter: "all" }}>Back to events</Link>
        </Button>
      </div>

      <Card className="space-y-4 p-5" style={{ borderRadius: 12 }}>
        <div>
          <label className="text-sm font-medium text-[#111827]" htmlFor="gate-search">
            Add an attendant
          </label>
          <Input
            id="gate-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username…"
            className="mt-2"
          />
        </div>

        {searching ? (
          <div className="flex justify-center py-4">
            <Spinner className="h-5 w-5" />
          </div>
        ) : results.length > 0 ? (
          <ul className="divide-y divide-[#E5E7EB] rounded-md border border-[#E5E7EB]">
            {results.map((r) => (
              <li key={r.user_id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {r.avatar_url ? (
                    <img
                      src={r.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#6B7280]">
                      {(r.username ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-sm text-[#111827]">
                    @{r.username ?? "user"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  disabled={busyId === r.user_id}
                  onClick={() => invite(r)}
                >
                  Add
                </Button>
              </li>
            ))}
          </ul>
        ) : query.trim().length >= 2 ? (
          <p className="text-sm text-[#6B7280]">No users found.</p>
        ) : null}
      </Card>

      <Card className="p-5" style={{ borderRadius: 12 }}>
        <h2 className="text-sm font-semibold text-[#111827]">Active attendants</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : assignments.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto h-7 w-7 text-[#D1D5DB]" />
            <p className="mt-2 text-sm text-[#6B7280]">
              No gate attendants assigned to this event yet.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-[#E5E7EB]">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  {a.avatar_url ? (
                    <img
                      src={a.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#6B7280]">
                      {(a.username ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-sm text-[#111827]">
                    @{a.username ?? "user"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busyId === a.id}
                  onClick={() => revoke(a.id)}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
