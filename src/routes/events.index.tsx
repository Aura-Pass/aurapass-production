import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventCard } from "@/components/ui/event-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_CATEGORIES, CITIES } from "@/constants";
import { usePublishedEvents } from "@/hooks/usePublishedEvents";
import { toEventCardData } from "@/lib/event-adapter";

export const Route = createFileRoute("/events/")({
  head: () => ({
    meta: [
      { title: "Discover Events — AuraPass" },
      { name: "description", content: "Browse events happening across Nigeria on AuraPass." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "free" | "paid">("all");
  const [city, setCity] = useState<string>("all");

  const { events, loading } = usePublishedEvents();

  const items = useMemo(() => {
    return events.map(toEventCardData).filter((e) => {
      if (activeCategory !== "all") {
        const slug = EVENT_CATEGORIES.find((c) => c.label === e.category)?.slug;
        if (slug !== activeCategory && e.category !== activeCategory) return false;
      }
      if (city !== "all" && e.city !== city) return false;
      if (paidFilter === "free" && !e.is_free) return false;
      if (paidFilter === "paid" && e.is_free) return false;
      return true;
    });
  }, [events, activeCategory, city, paidFilter]);

  return (
    <PageWrapper>
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Discover Events
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] md:text-base">
            Browse what's happening across Nigeria this season.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap gap-2">
              <CategoryPill
                label="All"
                active={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              />
              {EVENT_CATEGORIES.map((c) => (
                <CategoryPill
                  key={c.slug}
                  label={c.label}
                  active={activeCategory === c.slug}
                  onClick={() => setActiveCategory(c.slug)}
                />
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:border-[#D946EF] focus:ring-2 focus:ring-[#D946EF]/20"
                aria-label="City"
              >
                <option value="all">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Input type="date" aria-label="Date" />
              <div className="inline-flex rounded-md border border-[#E5E7EB] bg-white p-1">
                {(["all", "free", "paid"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPaidFilter(opt)}
                    className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                      paidFilter === opt
                        ? "bg-[#D946EF] text-white"
                        : "text-[#6B7280] hover:text-[#111827]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <Button variant="outline">More filters</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] py-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 w-full rounded-xl" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-white py-16 text-center">
              <p className="text-sm text-[#6B7280]">
                No events found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageWrapper>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-[#D946EF] text-white"
          : "bg-white text-[#6B7280] border border-[#E5E7EB] hover:text-[#111827] hover:border-[#D946EF]"
      }`}
    >
      {label}
    </button>
  );
}
