/**
 * EquipmentBookingList — shared list UI for the lister inbox and the
 * requester's sent equipment booking requests.
 *  - lister:    Accept / Decline on direct requests awaiting a response
 *  - requester: read-only status + negotiation thread + payments
 */
import { useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Loader2, MapPin, MessageSquare, Speaker } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import {
  useEquipmentBookingRequests,
  type EquipmentBookingRequest,
} from "@/hooks/useEquipmentBookings";
import { EquipmentBookingThread } from "@/components/equipment/EquipmentBookingThread";
import { bookingStatusClasses, formatNaira } from "@/lib/bookings";

const STATUS_LABEL: Record<string, string> = {
  awaiting_lister_response: "Awaiting lister response",
  negotiating: "Negotiating",
  awaiting_deposit: "Awaiting deposit",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
  expired: "Expired",
};

export function EquipmentBookingList({
  perspective,
}: {
  perspective: "lister" | "requester";
}) {
  const { bookings, names, loading, refetch } = useEquipmentBookingRequests(perspective);
  const [openId, setOpenId] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);

  async function respond(booking: EquipmentBookingRequest, decision: "accept" | "decline") {
    setResponding(booking.id);
    const { error } = await (supabase as any).rpc("respond_to_equipment_booking_request", {
      _equipment_booking_request_id: booking.id,
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
        <p className="text-sm text-muted-foreground">
          {perspective === "lister"
            ? "No equipment booking requests yet. Organisers will find your gear in the equipment directory."
            : "You haven't requested any equipment yet. Browse the equipment directory to get started."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => {
        const other = perspective === "lister" ? b.requester_id : b.lister_id;
        const counterpart = names[other] ?? (perspective === "lister" ? "Organiser" : "Lister");
        const canRespond =
          perspective === "lister" &&
          b.mode === "direct" &&
          b.status === "awaiting_lister_response";
        const price = b.final_price ?? b.requested_price;
        const photo = b.equipment_listings?.photo_urls?.[0];

        return (
          <Card key={b.id} className="p-5" style={{ borderRadius: 12 }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-accent">
                  {photo ? (
                    <img
                      src={photo}
                      alt={b.equipment_listings?.title ?? "Equipment"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Speaker className="h-5 w-5 text-muted-foreground-light" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground">
                    {b.equipment_listings?.title ?? "Equipment"}
                  </h3>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {b.event_date ?? "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {b.venue ?? "—"}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.event_name ?? "Event"}
                    {b.expected_attendance
                      ? ` · ~${Number(b.expected_attendance).toLocaleString("en-NG")} expected`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {perspective === "lister" ? "From" : "Lister"}:{" "}
                    <span className="font-medium">{counterpart}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge className={bookingStatusClasses(b.status)}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </Badge>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {b.final_price ? "Agreed: " : "Requested: "}
                  {formatNaira(price)}
                </p>
                <p className="text-xs text-muted-foreground-light">
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

            {openId === b.id ? (
              <EquipmentBookingThread
                booking={b}
                counterpartName={counterpart}
                onChanged={refetch}
              />
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
