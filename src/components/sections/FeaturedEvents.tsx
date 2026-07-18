import { Link } from "@tanstack/react-router";
import { EventCard } from "@/components/ui/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import { toEventCardData } from "@/lib/event-adapter";

export function FeaturedEvents() {
  const { events, loading } = usePublishedEvents(6);
  const items = events.map(toEventCardData);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2
              className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Featured Events
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              Handpicked moments you don't want to miss.
            </p>
          </div>
          <Link
            to="/events"
            className="text-sm font-semibold text-[#D946EF] hover:underline flex items-center gap-1 shrink-0"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-16 text-center">
            <p className="text-sm text-[#6B7280]">
              No events right now — check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="-mx-4 overflow-x-auto px-4 md:hidden">
              <div className="flex gap-4 pb-2" style={{ width: "max-content" }}>
                {items.map((e) => (
                  <div key={e.id} className="w-[280px] shrink-0">
                    <EventCard event={e} />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
              {items.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
