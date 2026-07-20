import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EventCard } from "@/components/ui/event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_CATEGORIES, CITIES } from "@/constants";
import { usePublishedEvents, type PublishedEvent } from "@/hooks/usePublishedEvents";
import { toEventCardData } from "@/lib/event-adapter";

type DateFilter = "any" | "today" | "weekend" | "week" | "month";
type PriceFilter = "any" | "free" | "under2k" | "2k5k" | "5k10k" | "above10k";

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === "string" ? search.category : undefined,
    city: typeof search.city === "string" ? search.city : undefined,
    date: typeof search.date === "string" ? search.date : undefined,
    price: typeof search.price === "string" ? search.price : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Discover Events | AuraPass" },
      { name: "description", content: "Browse events happening across Nigeria on AuraPass." },
    ],
  }),
  component: EventsPage,
});

function applyDateFilter(events: PublishedEvent[], filter: DateFilter) {
  if (filter === "any") return events;

  const now = new Date();

  function parseLocalDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const dayOfWeek = now.getDay();
  const daysUntilSaturday = dayOfWeek === 6 ? 7 : 6 - dayOfWeek;
  const nextSaturday = new Date(today.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
  const nextMonday = new Date(nextSaturday.getTime() + 2 * 24 * 60 * 60 * 1000);

  const endOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  switch (filter) {
    case "today":
      return events.filter((e) => {
        const d = parseLocalDate(e.event_date);
        return d >= today && d < tomorrow;
      });
    case "weekend":
      return events.filter((e) => {
        const d = parseLocalDate(e.event_date);
        return d >= nextSaturday && d < nextMonday;
      });
    case "week":
      return events.filter((e) => {
        const d = parseLocalDate(e.event_date);
        return d >= today && d <= endOfWeek;
      });
    case "month":
      return events.filter((e) => {
        const d = parseLocalDate(e.event_date);
        return d >= today && d <= endOfMonth;
      });
    default:
      return events;
  }
}


function applyPriceFilter(events: PublishedEvent[], filter: PriceFilter) {
  switch (filter) {
    case "free":
      return events.filter(
        (e) => (e.ticket_types?.length ?? 0) > 0 && e.ticket_types!.every((tt) => Number(tt.price) === 0),
      );
    case "under2k":
      return events.filter((e) =>
        e.ticket_types?.some((tt) => Number(tt.price) > 0 && Number(tt.price) < 2000),
      );
    case "2k5k":
      return events.filter((e) =>
        e.ticket_types?.some((tt) => Number(tt.price) >= 2000 && Number(tt.price) <= 5000),
      );
    case "5k10k":
      return events.filter((e) =>
        e.ticket_types?.some((tt) => Number(tt.price) >= 5000 && Number(tt.price) <= 10000),
      );
    case "above10k":
      return events.filter((e) => e.ticket_types?.some((tt) => Number(tt.price) > 10000));
    default:
      return events;
  }
}

const DATE_OPTIONS: { value: DateFilter; label: string }[] = [
  { value: "any", label: "Any Date" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This Weekend" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: "any", label: "Any Price" },
  { value: "free", label: "Free" },
  { value: "under2k", label: "Under ₦2,000" },
  { value: "2k5k", label: "₦2,000 – ₦5,000" },
  { value: "5k10k", label: "₦5,000 – ₦10,000" },
  { value: "above10k", label: "Above ₦10,000" },
];

function EventsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>(search.category ?? "all");
  const [activeCity, setActiveCity] = useState<string>(search.city ?? "all");
  const [dateFilter, setDateFilter] = useState<DateFilter>((search.date as DateFilter) ?? "any");
  const [priceFilter, setPriceFilter] = useState<PriceFilter>((search.price as PriceFilter) ?? "any");
  const [showPast, setShowPast] = useState(false);

  const { events, loading } = usePublishedEvents(undefined, showPast);

  function updateSearch(next: {
    category?: string;
    city?: string;
    date?: DateFilter;
    price?: PriceFilter;
  }) {
    const cat = next.category ?? activeCategory;
    const cty = next.city ?? activeCity;
    const dt = next.date ?? dateFilter;
    const pr = next.price ?? priceFilter;
    navigate({
      to: "/events",
      search: {
        category: cat !== "all" ? cat : undefined,
        city: cty !== "all" ? cty : undefined,
        date: dt !== "any" ? dt : undefined,
        price: pr !== "any" ? pr : undefined,
      },
      replace: true,
    });
  }

  function handleCategoryChange(slug: string) {
    setActiveCategory(slug);
    updateSearch({ category: slug });
  }
  function handleCityChange(c: string) {
    setActiveCity(c);
    updateSearch({ city: c });
  }
  function handleDateChange(d: DateFilter) {
    setDateFilter(d);
    updateSearch({ date: d });
  }
  function handlePriceChange(p: PriceFilter) {
    setPriceFilter(p);
    updateSearch({ price: p });
  }

  const filteredEvents = useMemo(() => {
    let result = events;

    if (activeCategory !== "all") {
      result = result.filter((e) => {
        const slug = EVENT_CATEGORIES.find((c) => c.label === e.category)?.slug;
        return (
          slug === activeCategory ||
          e.category.toLowerCase() === activeCategory.toLowerCase()
        );
      });
    }

    if (activeCity && activeCity !== "all") {
      result = result.filter((e) => e.city.toLowerCase() === activeCity.toLowerCase());
    }

    result = applyDateFilter(result, dateFilter);
    result = applyPriceFilter(result, priceFilter);

    if (!showPast) {
      const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
      result = result.filter((e) => {
        if (!e.event_date) return false;
        const start = new Date(`${e.event_date}T${e.event_time ?? "00:00:00"}`);
        return start > cutoff;
      });
    }

    return result;
  }, [events, activeCategory, activeCity, dateFilter, priceFilter, showPast]);

  const items = useMemo(() => filteredEvents.map(toEventCardData), [filteredEvents]);

  const activeFilterCount = [
    activeCategory !== "all",
    activeCity !== "all",
    dateFilter !== "any",
    priceFilter !== "any",
  ].filter(Boolean).length;

  function clearAllFilters() {
    setActiveCategory("all");
    setActiveCity("all");
    setDateFilter("any");
    setPriceFilter("any");
    navigate({ to: "/events", search: {}, replace: true });
  }

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
                onClick={() => handleCategoryChange("all")}
              />
              {EVENT_CATEGORIES.map((c) => (
                <CategoryPill
                  key={c.slug}
                  label={c.label}
                  active={activeCategory === c.slug}
                  onClick={() => handleCategoryChange(c.slug)}
                />
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {DATE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleDateChange(opt.value)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    dateFilter === opt.value
                      ? "bg-[#D946EF] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handlePriceChange(opt.value)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    priceFilter === opt.value
                      ? "bg-[#D946EF] text-white"
                      : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <select
                value={activeCity}
                onChange={(e) => handleCityChange(e.target.value)}
                className="h-11 rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] focus:outline-none focus:border-[#D946EF] focus:ring-2 focus:ring-[#D946EF]/20"
                aria-label="City"
              >
                <option value="all">All cities</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="text-xs text-[#6B7280] hover:text-[#D946EF] underline transition-colors"
              >
                {showPast ? "Hide past events" : "Show past events"}
              </button>

              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B7280]">
                    {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
                  </span>
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-[#D946EF] hover:underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
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
                {events.length === 0
                  ? "No events right now — check back soon!"
                  : "No events match those filters. Try broadening your search."}
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
