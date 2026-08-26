import { ImageIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatPriceRange } from "@/lib/utils";
import type { MockEvent } from "@/constants/mockEvents";

export function EventCard({ event }: { event: MockEvent }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug ?? event.id }}
      className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
    >
      <Card className="flex h-full flex-col overflow-hidden group cursor-pointer">
        <div className="relative aspect-[16/10] w-full bg-accent flex items-center justify-center overflow-hidden">
          {event.banner_url ? (
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-10 w-10 text-muted-foreground-light" />
          )}
          <div className="absolute left-3 top-3">
            {event.status === "sold_out" ? (
              <Badge variant="sold-out">Sold out</Badge>
            ) : (
              <Badge variant="default">{event.category}</Badge>
            )}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="space-y-1">
            <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary transition-colors">
              {event.title}
            </h3>
            <p className="text-xs text-muted-foreground">by {event.organizer_name}</p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>{formatDate(event.date)} · {event.time}</p>
            <p>{event.venue}, {event.city}</p>
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <Badge variant="outline">
              {event.is_free ? "Free" : formatPriceRange(event.min_price, event.max_price, false)}
            </Badge>
            <span className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors group-hover:bg-brand-hover">
              Buy Tickets
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
