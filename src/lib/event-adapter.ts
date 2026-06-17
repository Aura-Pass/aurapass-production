import type { MockEvent } from "@/constants/mockEvents";
import type { PublishedEvent } from "@/hooks/usePublishedEvents";

export function toEventCardData(e: PublishedEvent): MockEvent {
  const tickets = e.ticket_types ?? [];
  const prices = tickets.map((t) => Number(t.price));
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const isFree = prices.length > 0 && max === 0;
  const status: MockEvent["status"] =
    e.status === "sold_out" ? "sold_out" : "published";

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    banner_url: e.banner_url ?? "",
    category: e.category,
    venue: e.venue,
    city: e.city,
    date: e.event_date,
    time: (e.event_time ?? "").slice(0, 5),
    organizer_name: "Organiser",
    min_price: min,
    max_price: max,
    is_free: isFree,
    status,
  };
}
