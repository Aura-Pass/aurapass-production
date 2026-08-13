/**
 * BookingList — shared list UI for both the artist inbox and the organiser's
 * sent booking requests. `perspective` switches the available actions:
 *  - artist:    Accept / Decline (respond_to_booking_request)
 *  - organiser: read-only status + negotiation thread
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useBookingRequests } from "@/hooks/useBookings";
import { BookingThread } from "@/components/bookings/BookingThread";
import {
  BOOKING_STATUS_LABEL,
  bookingStatusClasses,
  formatNaira,
  type BookingRequest,
} from "@/lib/bookings";

export function BookingList({ perspective }: { perspective: "artist" | "organiser" }) {
  const { bookings, names, loading, refetch } = useBookingRequests(perspective);
  const [openId, setOpenId] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  async function respond(booking: BookingRequest, decision: "accept" | "decline") {
    setResponding(booking.id);
    const { error } = await (supabase as any).rpc("respond_to_booking_request", {
      _booking_request_id: booking.id,
      _decision: decision,
    });
    setResponding(null);
    if (error) {
      toast.error(error.message ?? "Could not update this request.");
      return;
    }
    toast.success(decision === "accept" ? "Request accepted." : "Request declined.");
    await refetch();
  }

  if (loading) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!bookings.length) {
    return (
      <Card className="p-6" style={{ borderRadius: 12 }}>
        <p className="text-sm text-[#6B7280]">
          {perspective === "artist"
            ? "No booking requests yet. Organisers will find you in the artist directory when they create an event."
            : "You haven't sent any booking requests yet. Add artists while creating your next event."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const other = perspective === "artist" ? b.organiser_id : b.artist_id;
        const counterpart = names[other] ?? (perspective === "artist" ? "Organiser" : "Artist");
        const canRespond =
          perspective === "artist" && b.status === "awaiting_artist_response";
        const price = b.final_price ?? b.requested_price;
        const standalone = !b.events;
        const title = b.events?.title ?? b.standalone_event_name ?? "Event";
        const dateLine = b.events
          ? `${b.events.event_date ?? "—"} ${b.events.event_time?.slice(0, 5) ?? ""}`
          : b.standalone_event_date ?? "—";
        const placeLine = b.events
          ? `${b.events.venue ? `${b.events.venue}, ` : ""}${b.events.city ?? "—"}`
          : b.standalone_venue ?? "—";

        return (
          <Card key={b.id} className="p-5" style={{ borderRadius: 12 }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#111827]">{title}</h3>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    {dateLine}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {placeLine}
                  </span>
                </p>
                {standalone ? (
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {b.standalone_event_type ?? "Event"}
                    {b.standalone_expected_attendance
                      ? ` · ~${Number(b.standalone_expected_attendance).toLocaleString("en-NG")} expected`
                      : ""}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-[#374151]">
                  {perspective === "artist" ? "From" : "Artist"}:{" "}
                  <span className="font-medium">{counterpart}</span>
                </p>
              </div>
              <div className="text-right">
                <Badge className={`${bookingStatusClasses(b.status)} hover:${bookingStatusClasses(b.status)}`}>
                  {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                </Badge>
                <p className="mt-2 text-sm font-semibold text-[#111827]">
                  {b.final_price ? "Agreed: " : "Requested: "}
                  {formatNaira(price)}
                </p>
                <p className="text-xs text-[#9CA3AF]">
                  {b.mode === "negotiate" ? "Negotiable" : "Direct request"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenId(openId === b.id ? null : b.id)}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {openId === b.id ? "Hide conversation" : "View conversation"}
              </Button>

              {!standalone && b.events?.slug ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/events/$slug" params={{ slug: b.events.slug }}>
                    View event
                  </Link>
                </Button>
              ) : null}


              {canRespond ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={responding === b.id}
                    onClick={() => respond(b, "accept")}
                  >
                    {responding === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={responding === b.id}
                    onClick={() => respond(b, "decline")}
                  >
                    Decline
                  </Button>
                </>
              ) : null}
            </div>

            {b.status === "pending_event_approval" ? (
              <p className="mt-3 text-xs text-[#B45309]">
                This request unlocks once the event is approved by AuraPass.
              </p>
            ) : null}

            {openId === b.id ? (
              <BookingThread booking={b} counterpartName={counterpart} onChanged={refetch} />
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
