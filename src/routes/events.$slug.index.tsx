import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Calendar, MapPin, Clock, ImageIcon, Share2, Check } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui/spinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Event } from "@/types";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { FollowButton } from "@/components/ui/FollowButton";

interface TicketTypeDisplay {
  id: string;
  name: string;
  price: number;
}

interface EventWithTickets extends Omit<Event, "ticket_types"> {
  ticket_types: TicketTypeDisplay[];
  organiser_name: string;
  organiser_username: string | null;
  organiser_avatar_url: string | null;
}

type Availability =
  | { type: "loading" }
  | { type: "privileged"; quantity: number; quantity_sold: number; remaining: number }
  | { type: "public"; status: "low" | "available"; remaining?: number; label: string };

import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { getPublishedEventForHead } from "@/lib/events.functions";

const search = z.object({
  aref: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/events/$slug/")({
  validateSearch: zodValidator(search),
  loader: ({ params }) => getPublishedEventForHead({ data: { slug: params.slug } }),
  head: ({ loaderData: event, params }) => {
    const canonicalUrl = event
      ? `https://aurapassticket.com/events/${event.slug ?? params.slug}`
      : `https://aurapassticket.com/events/${params.slug}`;
    const image = event?.banner_url ?? "https://aurapassticket.com/og-default.png";
    return {
      meta: event
        ? [
            { title: `${event.title} | AuraPass` },
            { name: "description", content: (event.description ?? "").slice(0, 160) },
            { property: "og:title", content: event.title },
            { property: "og:description", content: (event.description ?? "").slice(0, 160) },
            { property: "og:image", content: image },
            { property: "og:url", content: canonicalUrl },
            { property: "og:type", content: "article" },
            { property: "og:site_name", content: "AuraPass" },
            { name: "twitter:card", content: "summary_large_image" },
            { name: "twitter:title", content: event.title },
            { name: "twitter:image", content: image },
          ]
        : [{ title: "Event | AuraPass" }],
      links: [{ rel: "canonical", href: canonicalUrl }],
      scripts: event
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Event",
                name: event.title,
                description: (event.description ?? "").slice(0, 500),
                startDate: event.event_date ?? undefined,
                image: event.banner_url ? [event.banner_url] : undefined,
                url: canonicalUrl,
                eventStatus: "https://schema.org/EventScheduled",
                eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
                location: {
                  "@type": "Place",
                  name: (event as any).venue ?? (event as any).location ?? "Nigeria",
                  address: (event as any).location ?? (event as any).city ?? "Nigeria",
                },
                organizer: {
                  "@type": "Organization",
                  name: "AuraPass",
                  url: "https://aurapassticket.com",
                },
              }),
            },
          ]
        : [],
    };
  },
  notFoundComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Event not found</h1>
        <p className="mt-2 text-[#6B7280]">This event may have been removed or never existed.</p>
        <div className="mt-6">
          <Button asChild variant="primary">
            <Link to="/events">Back to events</Link>
          </Button>
        </div>
      </div>
    </PageWrapper>
  ),
  errorComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Something went wrong</h1>
      </div>
    </PageWrapper>
  ),
  component: EventDetailPage,
});

function EventDetailPage() {
  const { slug } = Route.useParams();
  const [event, setEvent] = useState<EventWithTickets | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { aref } = Route.useSearch();

  async function handleBuyTickets(ticketTypeId: string) {
    if (authLoading) return;

    let isAuthenticated = !!user;
    if (!isAuthenticated) {
      const { supabase } = await import("@/lib/supabase");
      const { data: { session } } = await supabase.auth.getSession();
      isAuthenticated = !!session;
    }

    if (!isAuthenticated) {
      navigate({
        to: "/login",
        search: {
          redirect: `/events/${slug}/checkout`,
          ticketTypeId,
          ...(aref ? { aref } : {}),
        },
      });
      return;
    }

    navigate({
      to: "/events/$slug/checkout",
      params: { slug },
      search: { ticketTypeId, ...(aref ? { aref } : {}) },
    });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select(`*, ticket_types (id, name, price)`)
        .eq("slug", slug)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setEvent(null);
      } else {
        const { data: organiserProfile } = await (supabase as any)
          .from("profiles")
          .select("id, full_name, username, avatar_url, bio")
          .eq("id", (data as any).organiser_id)
          .maybeSingle();

        if (!active) return;
        setEvent({
          ...(data as any),
          ticket_types: (data as any).ticket_types ?? [],
          organiser_name: organiserProfile?.full_name ?? "Organiser",
          organiser_username: organiserProfile?.username ?? null,
          organiser_avatar_url: organiserProfile?.avatar_url ?? null,
        });
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!event || typeof document === "undefined") return;
    const title = `${event.title} | AuraPass`;
    document.title = title;
    const url = typeof window !== "undefined" ? window.location.href : "";
    const desc = (event.description ?? "").slice(0, 160);
    const setMeta = (attr: "name" | "property", key: string, value: string) => {
      if (!value) return;
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };
    setMeta("name", "description", desc);
    setMeta("property", "og:title", event.title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "article");
    if (event.banner_url) {
      setMeta("property", "og:image", event.banner_url);
      setMeta("name", "twitter:image", event.banner_url);
      setMeta("name", "twitter:card", "summary_large_image");
    }
  }, [event]);

  useEffect(() => {
    if (!event?.ticket_types?.length) return;
    let active = true;
    setAvailability(
      Object.fromEntries(event.ticket_types.map((t) => [t.id, { type: "loading" } as Availability])),
    );

    (async () => {
      const results = await Promise.all(
        event.ticket_types.map(async (t) => {
          const { data, error } = await (supabase as any).rpc("get_ticket_availability", {
            p_ticket_type_id: t.id,
          });
          if (error || !data) return null;
          const result = data as any;
          const availabilityEntry: Availability = result.privileged
            ? {
                type: "privileged",
                quantity: Number(result.quantity),
                quantity_sold: Number(result.quantity_sold),
                remaining: Number(result.remaining),
              }
            : {
                type: "public",
                status: result.status,
                remaining: result.remaining != null ? Number(result.remaining) : undefined,
                label: result.label,
              };
          return [t.id, availabilityEntry] as [string, Availability];
        }),
      );
      if (!active) return;
      setAvailability((prev) => ({
        ...prev,
        ...Object.fromEntries(results.filter((r): r is [string, Availability] => r !== null)),
      }));
    })();

    return () => {
      active = false;
    };
  }, [event?.ticket_types]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!event) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Event not found</h1>
          <p className="mt-2 text-[#6B7280]">This event may have been removed or never existed.</p>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/events">Back to events</Link>
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const tiers = event.ticket_types ?? [];
  const prices = tiers.map((t) => Number(t.price));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const isFree = prices.length > 0 && maxPrice === 0;

  const startingFrom = isFree
    ? "Free"
    : prices.length === 0
    ? "TBA"
    : minPrice === maxPrice
    ? formatCurrency(minPrice)
    : `${formatCurrency(minPrice)} – ${formatCurrency(maxPrice)}`;

  

  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-[#F3F4F6] md:aspect-[16/9]">
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                onClick={() => setLightboxOpen(true)}
                className="h-full w-full cursor-zoom-in object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-14 w-14 text-[#9CA3AF]" />
              </div>
            )}
            <div
              className="absolute inset-x-0 bottom-0 p-5 md:p-8"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
            >
              <Badge variant="default">{event.category}</Badge>
              <h1
                className="mt-3 text-3xl font-bold tracking-tight text-white md:text-5xl"
                style={{ fontFamily: '"Playfair Display", serif' }}
              >
                {event.title}
              </h1>
              <div className="mt-4 grid gap-2 text-sm text-white/90 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#D946EF]" />
                  {formatDate(event.event_date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D946EF]" />
                  {(event.event_time ?? "").slice(0, 5)}
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-[#D946EF]" />
                  {event.venue}, {event.city}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[#111827]">About this event</h2>
                <p className="whitespace-pre-line text-[#6B7280] leading-relaxed">{event.description}</p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#111827]">Tickets</h2>
                {tiers.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">No ticket types available yet.</p>
                ) : (
                  <RadioGroup
                    value={selectedTicketId}
                    onValueChange={setSelectedTicketId}
                    className="space-y-2"
                  >
                    {tiers.map((t) => {
                      const av = availability[t.id];
                      const soldOut =
                        av && av.type !== "loading" && (av.type === "privileged" ? av.remaining < 1 : (av.remaining ?? 1) < 1);
                      return (
                        <Label
                          key={t.id}
                          htmlFor={`tt-${t.id}`}
                          className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition ${
                            selectedTicketId === t.id
                              ? "border-[#D946EF] bg-[#FDF4FF]"
                              : "border-[#E5E7EB] bg-white"
                          } ${soldOut ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem id={`tt-${t.id}`} value={t.id} disabled={soldOut} />
                            <div>
                              <p className="font-semibold text-[#111827]">{t.name}</p>
                              <p className="text-sm text-[#6B7280]">
                                {Number(t.price) === 0 ? "Free" : formatCurrency(Number(t.price))}
                                {" · "}
                                {!av || av.type === "loading" ? (
                                  "Checking availability…"
                                ) : av.type === "privileged" ? (
                                  `${av.quantity_sold} / ${av.quantity} sold`
                                ) : av.status === "low" ? (
                                  <span className="font-medium text-amber-600">{av.label}</span>
                                ) : (
                                  av.label
                                )}
                              </p>
                            </div>
                          </div>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                )}
              </div>
            </div>

            <aside className="space-y-4">
              <Card className="p-6">
                <p className="text-sm text-[#6B7280]">Starting from</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">{startingFrom}</p>
                <Button
                  variant="primary"
                  size="lg"
                  className="mt-4 w-full"
                  onClick={() => {
                    const ttId = selectedTicketId || tiers[0]?.id;
                    if (!ttId) return;
                    handleBuyTickets(ttId);
                  }}
                  disabled={tiers.length === 0 || authLoading}
                >
                  Buy Tickets
                </Button>
                {tiers.length > 1 && !selectedTicketId && (
                  <p className="mt-2 text-xs text-[#6B7280] text-center">
                    Select a ticket type above.
                  </p>
                )}
                <ShareEventButton title={event.title} description={event.description ?? ""} />
              </Card>


              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Organiser
                </p>
                {event.organiser_username ? (
                  <Link
                    to="/organisers/$username"
                    params={{ username: event.organiser_username }}
                    className="mt-3 flex items-center gap-3 rounded-lg -mx-2 px-2 py-2 hover:bg-[#F9FAFB] transition"
                  >
                    <Avatar>
                      {event.organiser_avatar_url ? (
                        <img
                          src={event.organiser_avatar_url}
                          alt={event.organiser_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <AvatarFallback className="bg-[#FDF4FF] text-[#A21CAF] font-semibold">
                          {event.organiser_name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-[#111827]">{event.organiser_name}</p>
                      <p className="text-xs text-[#A21CAF]">
                        @{event.organiser_username} · View profile →
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-[#FDF4FF] text-[#A21CAF] font-semibold">
                        {event.organiser_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-[#111827]">{event.organiser_name}</p>
                      <p className="text-xs text-[#6B7280]">Verified organiser</p>
                    </div>
                  </div>
                )}
                {event.organiser_id && user?.id !== event.organiser_id && (
                  <div className="mt-4">
                    <FollowButton organiserId={event.organiser_id} size="sm" />
                  </div>
                )}
              </Card>
            </aside>
          </div>
        </div>
      </div>
      {lightboxOpen && event.banner_url && (
        <ImageLightbox
          src={event.banner_url}
          alt={event.title}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </PageWrapper>
  );
}

function ShareEventButton({ title, description }: { title: string; description: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const text = (description || "").slice(0, 160);
    const nav = window.navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ title, text, url });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await window.navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="relative mt-3">
      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full"
        onClick={handleShare}
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4" /> Link copied!
          </>
        ) : (
          <>
            <Share2 className="mr-2 h-4 w-4" /> Share Event
          </>
        )}
      </Button>
    </div>
  );
}
