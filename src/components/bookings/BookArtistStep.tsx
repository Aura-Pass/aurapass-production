/**
 * BookArtistStep — optional "Book an Artist" step in the event-creation flow.
 *
 * The step only collects selections; the actual booking_requests rows are
 * inserted after the event row exists (create-event handleSubmit), because
 * every request needs a real event_id owned by the signed-in organiser.
 */
import { useEffect, useMemo, useState } from "react";
import { Music2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/bookings";
import { citiesMatch } from "@/lib/nigerianCities";
import type { ArtistProfile } from "@/lib/artists";

export interface BookingSelection {
  artistUserId: string;
  artistProfileId: string;
  stageName: string;
  mode: "direct" | "negotiate";
  requestedPrice: number | null;
  /** Queued opening note — sent from the booking thread once it's open. */
  draftMessage: string;
}

interface Props {
  city: string;
  selections: BookingSelection[];
  onChange: (next: BookingSelection[]) => void;
}

export function BookArtistStep({ city, selections, onChange }: Props) {
  const [artists, setArtists] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [onlyLocal, setOnlyLocal] = useState(true);
  const [maxPrice, setMaxPrice] = useState("");
  const [negotiateFor, setNegotiateFor] = useState<string | null>(null);
  const [negotiateNote, setNegotiateNote] = useState("");
  const [negotiatePrice, setNegotiatePrice] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await (supabase as any)
        .from("artist_profiles")
        .select("*")
        .eq("status", "approved")
        .order("stage_name", { ascending: true });
      if (!active) return;
      setArtists(((data as ArtistProfile[] | null) ?? []));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const cap = maxPrice.trim() ? Number(maxPrice) : null;
    return artists.filter((a) => {
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const hit =
          a.stage_name.toLowerCase().includes(q) ||
          (a.genres ?? []).some((g) => g.toLowerCase().includes(q));
        if (!hit) return false;
      }
      if (onlyLocal && city) {
        const locations = a.available_locations ?? [];
        if (locations.length && !locations.some((l) => citiesMatch(l, city))) return false;
      }
      if (cap !== null && !Number.isNaN(cap)) {
        if (a.estimated_rate !== null && a.estimated_rate !== undefined && a.estimated_rate > cap)
          return false;
      }
      return true;
    });
  }, [artists, query, onlyLocal, city, maxPrice]);

  function isSelected(userId: string) {
    return selections.some((s) => s.artistUserId === userId);
  }

  function remove(userId: string) {
    onChange(selections.filter((s) => s.artistUserId !== userId));
  }

  function addDirect(a: ArtistProfile) {
    if (isSelected(a.user_id)) return remove(a.user_id);
    onChange([
      ...selections,
      {
        artistUserId: a.user_id,
        artistProfileId: a.id,
        stageName: a.stage_name,
        mode: "direct",
        requestedPrice: a.estimated_rate ?? null,
        draftMessage: "",
      },
    ]);
  }

  function openNegotiate(a: ArtistProfile) {
    setNegotiateFor(a.id);
    setNegotiatePrice(a.estimated_rate ? String(a.estimated_rate) : "");
    setNegotiateNote("");
  }

  function confirmNegotiate(a: ArtistProfile) {
    const price = negotiatePrice.trim() ? Number(negotiatePrice) : null;
    onChange([
      ...selections.filter((s) => s.artistUserId !== a.user_id),
      {
        artistUserId: a.user_id,
        artistProfileId: a.id,
        stageName: a.stage_name,
        mode: "negotiate",
        requestedPrice: price !== null && !Number.isNaN(price) ? price : null,
        draftMessage: negotiateNote.trim(),
      },
    ]);
    setNegotiateFor(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2
          className="text-2xl font-bold text-foreground"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Book an artist
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Line-ups sell tickets. Booking through AuraPass keeps the whole conversation,
          the agreed fee and the paperwork in one place — no chasing DMs, no surprises on
          show day, and the artist sees your event details up front. This step is optional:
          you can skip it and book later from your dashboard.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr_auto] sm:items-end">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground-light" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or genre"
            className="pl-9"
          />
        </div>
        <Input
          type="number"
          min="0"
          step="5000"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Max budget (₦)"
        />
        <label className="flex items-center gap-2 text-sm text-foreground-secondary">
          <input
            type="checkbox"
            checked={onlyLocal}
            onChange={(e) => setOnlyLocal(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
          Available in {city || "my city"}
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <Spinner className="h-7 w-7" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
          No approved artists match these filters. Try widening your budget or turning off the
          location filter.
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((a) => {
            const selected = selections.find((s) => s.artistUserId === a.user_id);
            return (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-card p-4"
                style={{ borderRadius: 12 }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-accent">
                      {a.photo_urls?.[0] ? (
                        <img
                          src={a.photo_urls[0]}
                          alt={a.stage_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          <Music2 className="h-5 w-5 text-muted-foreground-light" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{a.stage_name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(a.genres ?? []).slice(0, 4).map((g) => (
                          <Badge
                            key={g}
                            className="bg-brand-tint text-brand-hover hover:bg-brand-tint"
                          >
                            {g}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Estimated: {formatNaira(a.estimated_rate ?? null)}
                        {a.available_locations?.length
                          ? ` · ${a.available_locations.join(", ")}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selected?.mode === "direct" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => addDirect(a)}
                    >
                      {selected?.mode === "direct"
                        ? "Selected — estimated price"
                        : "Proceed at estimated price"}
                    </Button>
                    <Button
                      type="button"
                      variant={selected?.mode === "negotiate" ? "primary" : "outline"}
                      size="sm"
                      onClick={() => openNegotiate(a)}
                    >
                      Negotiate
                    </Button>
                    {selected ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => remove(a.user_id)}>
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>

                {negotiateFor === a.id ? (
                  <div className="mt-3 space-y-2 rounded-lg border border-brand-tint bg-brand-tint p-3">
                    <Input
                      type="number"
                      min="0"
                      step="5000"
                      value={negotiatePrice}
                      onChange={(e) => setNegotiatePrice(e.target.value)}
                      placeholder="Your offer (₦)"
                    />
                    <Textarea
                      rows={3}
                      value={negotiateNote}
                      onChange={(e) => setNegotiateNote(e.target.value)}
                      placeholder="Opening note to the artist (optional)"
                      maxLength={1000}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="primary" size="sm" onClick={() => confirmNegotiate(a)}>
                        Save offer
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setNegotiateFor(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}

                {selected ? (
                  <p className="mt-2 text-xs text-brand-hover">
                    {selected.mode === "negotiate"
                      ? `Negotiating at ${formatNaira(selected.requestedPrice)}`
                      : `Requesting at ${formatNaira(selected.requestedPrice)}`}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Prefer to sort the line-up later? Just continue — nothing is sent until you submit,
        and you can book artists any time from Organiser → Artist Bookings.
      </p>
    </div>
  );
}
