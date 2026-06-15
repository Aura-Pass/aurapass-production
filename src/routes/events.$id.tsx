import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Calendar, MapPin, Clock, ImageIcon } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MOCK_EVENTS } from "@/constants/mockEvents";
import { formatCurrency, formatDate, formatPriceRange } from "@/lib/utils";

export const Route = createFileRoute("/events/$id")({
  loader: ({ params }) => {
    const event = MOCK_EVENTS.find((e) => e.id === params.id);
    if (!event) throw notFound();
    return { event };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.event.title} — AuraPass` },
          { name: "description", content: loaderData.event.description },
          { property: "og:title", content: loaderData.event.title },
          { property: "og:description", content: loaderData.event.description },
        ]
      : [{ title: "Event — AuraPass" }],
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
  const { event } = Route.useLoaderData();

  const tiers = [
    { name: "Regular", price: event.is_free ? 0 : event.min_price },
    { name: "VIP", price: event.is_free ? 0 : Math.round((event.min_price + event.max_price) / 2) },
    { name: "VVIP", price: event.is_free ? 0 : event.max_price },
  ];

  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex aspect-[21/9] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4F6]">
            <ImageIcon className="h-14 w-14 text-[#9CA3AF]" />
          </div>

          <div className="mt-8 grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Badge variant="default">{event.category}</Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
                  {event.title}
                </h1>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm text-[#111827]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#D946EF]" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#D946EF]" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-[#D946EF]" />
                  {event.venue}, {event.city}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-[#111827]">About this event</h2>
                <p className="text-[#6B7280] leading-relaxed">{event.description}</p>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-[#111827]">Tickets</h2>
                <div className="space-y-2">
                  {tiers.map((t) => (
                    <Card key={t.name} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-[#111827]">{t.name}</p>
                        <p className="text-sm text-[#6B7280]">
                          {t.price === 0 ? "Free" : formatCurrency(t.price)}
                        </p>
                      </div>
                      <Button variant="secondary" size="sm" disabled>
                        Select
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <Card className="p-6">
                <p className="text-sm text-[#6B7280]">Starting from</p>
                <p className="mt-1 text-2xl font-bold text-[#111827]">
                  {formatPriceRange(event.min_price, event.max_price, event.is_free)}
                </p>
                <Button variant="primary" size="lg" className="mt-4 w-full" disabled>
                  Buy Tickets
                </Button>
                <p className="mt-2 text-xs text-[#6B7280] text-center">
                  Checkout coming soon.
                </p>
              </Card>

              <Card className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                  Organiser
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-[#FDF4FF] text-[#A21CAF] font-semibold">
                      {event.organizer_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-[#111827]">{event.organizer_name}</p>
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
