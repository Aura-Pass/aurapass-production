import { Link } from "@tanstack/react-router";
import { EventCard } from "@/components/ui/event-card";
import { MOCK_EVENTS } from "@/constants/mockEvents";

export function FeaturedEvents() {
  const events = MOCK_EVENTS.slice(0, 4);
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              Featured Events
            </h2>
            <p className="mt-1 text-sm text-[#6B7280]">Handpicked moments you don't want to miss.</p>
          </div>
          <Link
            to="/events"
            className="hidden text-sm font-semibold text-[#D946EF] hover:underline sm:inline"
          >
            View all →
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 md:hidden">
          <div className="flex gap-4 pb-2" style={{ width: "max-content" }}>
            {events.map((e) => (
              <div key={e.id} className="w-[280px] shrink-0">
                <EventCard event={e} />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden gap-6 md:grid md:grid-cols-2 lg:grid-cols-4">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </div>
    </section>
  );
}
