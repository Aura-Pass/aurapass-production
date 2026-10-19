import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ImageIcon, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { OptimiseBanners } from "@/components/admin/OptimiseBanners";
import { usePublishedEvents, type PublishedEvent } from "@/hooks/usePublishedEvents";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

const MAX_FEATURED = 8;

export const Route = createFileRoute("/dashboard/admin/featured")({
  head: () => ({ meta: [
    { title: "Featured events | AuraPass Admin" },
    { name: "description", content: "Manage AuraPass homepage featured events and event banner optimisation." },
    { property: "og:title", content: "Featured events | AuraPass Admin" },
    { property: "og:description", content: "Manage AuraPass homepage featured events and event banner optimisation." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AdminFeaturedPage,
});

function AdminFeaturedPage() {
  // All upcoming published events (the same set the public site shows).
  const { events, loading: eventsLoading } = usePublishedEvents();
  const [ids, setIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("featured_events")
        .select("event_id, position")
        .order("position", { ascending: true });
      if (!active) return;
      if (error) toast.error("Could not load featured events.");
      const list = ((data as any[]) ?? []).map((r) => r.event_id as string);
      setIds(list);
      setSavedIds(list);
      setLoadingFeatured(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Once events are known, drop featured entries that are no longer upcoming/published.
  const visibleIds = useMemo(
    () => (eventsLoading ? ids : ids.filter((id) => byId.has(id))),
    [ids, byId, eventsLoading],
  );

  const dirty =
    visibleIds.length !== savedIds.length || visibleIds.some((id, i) => id !== savedIds[i]);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events
      .filter((e) => !visibleIds.includes(e.id))
      .filter(
        (e) =>
          !q ||
          e.title.toLowerCase().includes(q) ||
          (e.city ?? "").toLowerCase().includes(q) ||
          (e.venue ?? "").toLowerCase().includes(q),
      );
  }, [events, visibleIds, query]);

  function move(index: number, dir: -1 | 1) {
    const next = [...visibleIds];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setIds(next);
  }

  async function save() {
    setSaving(true);
    const { data, error } = await (supabase as any).rpc("admin_set_featured_events", {
      p_event_ids: visibleIds,
    });
    setSaving(false);
    if (error || !data?.ok) {
      toast.error(
        data?.reason === "too_many"
          ? `You can feature at most ${MAX_FEATURED} events.`
          : (error?.message ?? "Could not save featured events."),
      );
      return;
    }
    setIds(visibleIds);
    setSavedIds(visibleIds);
    toast.success("Featured events updated.");
  }

  const loading = eventsLoading || loadingFeatured;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Featured events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose and order the events shown in “Featured Events” on the homepage. If none are
            selected, the next upcoming events are shown automatically.
          </p>
        </div>
        <Button variant="primary" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-4 md:p-5" style={{ borderRadius: 12 }}>
            <h2 className="text-base font-semibold text-foreground">
              On the homepage ({visibleIds.length}/{MAX_FEATURED})
            </h2>
            {visibleIds.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-border bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing selected — the homepage shows the next upcoming events.
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {visibleIds.map((id, i) => {
                  const e = byId.get(id) as PublishedEvent;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-background p-2"
                    >
                      <span className="w-5 text-center text-sm font-semibold text-muted-foreground">
                        {i + 1}
                      </span>
                      <Thumb url={e.banner_url} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{e.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDate(e.event_date)} · {e.city}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Move down"
                        disabled={i === visibleIds.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label="Remove from featured"
                        onClick={() => setIds(visibleIds.filter((x) => x !== id))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <Card className="p-4 md:p-5" style={{ borderRadius: 12 }}>
            <h2 className="text-base font-semibold text-foreground">Add an event</h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, city or venue"
                className="pl-9"
              />
            </div>
            <ul className="mt-3 max-h-[28rem] space-y-2 overflow-y-auto">
              {candidates.length === 0 ? (
                <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No matching upcoming events.
                </li>
              ) : (
                candidates.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-2"
                  >
                    <Thumb url={e.banner_url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(e.event_date)} · {e.city}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={visibleIds.length >= MAX_FEATURED}
                      onClick={() => setIds([...visibleIds, e.id])}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      )}

      <OptimiseBanners />
    </div>
  );
}

function Thumb({ url }: { url: string | null | undefined }) {
  return url ? (
    <img src={url} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
  ) : (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-muted">
      <ImageIcon className="h-5 w-5 text-muted-foreground-light" />
    </div>
  );
}
