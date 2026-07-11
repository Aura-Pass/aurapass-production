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
import type { Event, TicketType } from "@/types";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

interface EventWithTickets extends Event {
  ticket_types: TicketType[];
  organiser_name: string;
}

import { getPublishedEventForHead } from "@/lib/events.functions";

export const Route = createFileRoute("/events/$slug/")({
  loader: ({ params }) => getPublishedEventForHead({ data: { slug: params.slug } }),
  head: ({ loaderData: event, params }) => ({
    meta: event
      ? [
          { title: `${event.title} | AuraPass` },
          { name: "description", content: (event.description ?? "").slice(0, 160) },
          { property: "og:title", content: event.title },
          { property: "og:description", content: (event.description ?? "").slice(0, 160) },
          {
            property: "og:image",
            content: event.banner_url ?? "https://aurapassticket.com/og-default.png",
          },
          {
            property: "og:url",
            content: `https://aurapassticket.com/events/${event.slug ?? params.slug}`,
          },
          { property: "og:type", content: "website" },
          { property: "og:site_name", content: "AuraPass" },
          { name: "twitter:card", content: "summary_large_image" },
          { name: "twitter:title", content: event.title },
          {
            name: "twitter:image",
            content: event.banner_url ?? "https://aurapassticket.com/og-default.png",
          },
        ]
      : [{ title: "Event | AuraPass" }],
    links: event
      ? [{ rel: "canonical", href: `https://aurapassticket.com/events/${event.slug ?? params.slug}` }]
      : [{ rel: "canonical", href: `https://aurapassticket.com/events/${params.slug}` }],
  }),
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
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

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
        },
      });
      return;
    }

    navigate({
      to: "/events/$slug/checkout",
      params: { slug },
      search: { ticketTypeId },
    });
  }

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select(`*, ticket_types (*), profiles!events_organiser_id_fkey ( full_name )`)
        .eq("slug", slug)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        setEvent(null);
      } else {
        setEvent({
          ...(data as any),
          ticket_types: (data as any).ticket_types ?? [],
          organiser_name: (data as any).profiles?.full_name ?? "Organiser",
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
    setMeta("property", "og:type", "event");
    if (event.banner_url) {
      setMeta("property", "og:image", event.banner_url);
      setMeta("name", "twitter:image", event.banner_url);
      setMeta("name", "twitter:card", "summary_large_image");
    }
  }, [event]);

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
              <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
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
                      const remaining = Math.max(
                        0,
                        Number(t.quantity) - Number(t.quantity_sold),
                      );
                      const soldOut = remaining < 1;
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
                                {soldOut ? "Sold out" : `${remaining} left`}
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
              </Card>
            </aside>
          </div>
        </div>
      </div>
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
