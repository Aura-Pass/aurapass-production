import { ImageIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDate, formatPriceRange } from "@/lib/utils";
import type { MockEvent } from "@/constants/mockEvents";

export function EventCard({ event }: { event: MockEvent }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden group">
      <div className="relative aspect-[16/10] w-full bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
        <ImageIcon className="h-10 w-10 text-[#9CA3AF]" />
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
          <h3 className="line-clamp-2 text-base font-semibold text-[#111827] group-hover:text-[#D946EF] transition-colors">
            {event.title}
          </h3>
          <p className="text-xs text-[#6B7280]">by {event.organizer_name}</p>
        </div>
        <div className="space-y-1 text-xs text-[#6B7280]">
          <p>{formatDate(event.date)} · {event.time}</p>
          <p>{event.venue}, {event.city}</p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <Badge variant="outline">
            {event.is_free ? "Free" : formatPriceRange(event.min_price, event.max_price, false)}
          </Badge>
          <Button asChild size="sm" variant="primary">
            <Link to="/events/$id" params={{ id: event.id }}>Get Tickets</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
