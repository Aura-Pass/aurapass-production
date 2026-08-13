/**
 * Standalone artist booking page — book an artist for an event that does NOT
 * live on AuraPass. Unlike event-linked bookings (which wait for admin event
 * approval), these insert straight at their active status:
 *   direct    -> awaiting_artist_response
 *   negotiate -> negotiating (+ opening note sent immediately)
 * RLS enforces that the caller holds the organiser role and inserts as self.
 */
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Music2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { BecomeOrganiserCard } from "@/components/attendee/BecomeOrganiserCard";
import { useArtist } from "@/hooks/useArtists";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/bookings";

const EVENT_TYPES = [
  "Private Party",
  "Corporate Event",
  "Club Night",
  "Wedding",
  "Concert",
  "Other",
] as const;

export const Route = createFileRoute("/artists/$id/book")({
  head: () => ({
    meta: [
      { title: "Book an Artist | AuraPass" },
      {
        name: "description",
        content:
          "Send a booking request to an AuraPass artist for your private party, wedding, club night or corporate event.",
      },
      { property: "og:title", content: "Book an Artist | AuraPass" },
      {
        property: "og:description",
        content: "Agree the fee and keep the whole booking conversation in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookArtistPage,
});

function BookArtistPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { artist, loading } = useArtist(id);
  const { user, profile, activeRoles, loading: authLoading } = useAuth();

  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [venue, setVenue] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [attendance, setAttendance] = useState("");
  const [negotiating, setNegotiating] = useState(false);
  const [offer, setOffer] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isOrganiser = activeRoles.includes("organiser");

  if (loading || authLoading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!artist) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:px-6">
          <h1 className="text-2xl font-bold text-[#111827]">Artist not found</h1>
          <Button asChild variant="primary" size="sm" className="mt-6">
            <Link to="/artists">Back to artists</Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-md px-4 py-20 text-center md:px-6">
          <h1 className="text-2xl font-bold text-[#111827]">Sign in to book</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            You need an AuraPass account to send a booking request.
          </p>
          <Button asChild variant="primary" size="md" className="mt-6">
            <Link to="/login" search={{ redirect: `/artists/${id}/book` }}>
              Log in or sign up
            </Link>
          </Button>
        </div>
      </PageWrapper>
    );
  }

  if (!isOrganiser) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
          <h1 className="text-2xl font-bold text-[#111827]">
            Become an organiser to book {artist.stage_name}
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Bookings are made by organisers. Access is instant — you keep your attendee
            account too, and we'll bring you straight back here.
          </p>
          <div className="mt-6">
            <BecomeOrganiserCard
              fullName={profile?.full_name ?? ""}
              email={user.email ?? ""}
              onDone={() => {
                toast.success("Organiser access granted — continue your booking.");
              }}
            />
          </div>
        </div>
      </PageWrapper>
    );
  }

  function validate(): boolean {
    if (!eventName.trim()) {
      toast.error("Event name is required.");
      return false;
    }
    if (!eventDate) {
      toast.error("Event date is required.");
      return false;
    }
    if (!venue.trim()) {
      toast.error("Venue / location is required.");
      return false;
    }
    return true;
  }

  async function submit(mode: "direct" | "negotiate") {
    if (!artist || !user) return;
    if (!validate()) return;

    const price =
      mode === "direct"
        ? artist.estimated_rate ?? null
        : offer.trim()
          ? Number(offer)
          : null;
    if (mode === "negotiate" && price !== null && Number.isNaN(price)) {
      toast.error("Enter a valid offer amount.");
      return;
    }

    setSubmitting(true);
    const attendees = attendance.trim() ? Number(attendance) : null;

    const { data, error } = await (supabase as any)
      .from("booking_requests")
      .insert({
        event_id: null,
        artist_id: artist.user_id,
        organiser_id: user.id,
        mode,
        requested_price: price,
        status: mode === "direct" ? "awaiting_artist_response" : "negotiating",
        standalone_event_name: eventName.trim(),
        standalone_event_date: eventDate,
        standalone_venue: venue.trim(),
        standalone_event_type: eventType,
        standalone_expected_attendance:
          attendees !== null && !Number.isNaN(attendees) ? attendees : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setSubmitting(false);
      toast.error(error?.message ?? "Could not send this booking request.");
      return;
    }

    if (mode === "negotiate" && note.trim()) {
      const { error: msgError } = await (supabase as any).rpc("send_booking_message", {
        _booking_request_id: data.id,
        _message: note.trim(),
        _proposed_price: price,
      });
      if (msgError) console.error("[standalone booking note]", msgError);
    }

    setSubmitting(false);
    toast.success(`Booking request sent to ${artist.stage_name}.`);
    void navigate({ to: "/dashboard/organiser/bookings" });
  }

  return (
    <PageWrapper>
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F3F4F6]">
            {artist.photo_urls?.[0] ? (
              <img
                src={artist.photo_urls[0]}
                alt={artist.stage_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Music2 className="h-6 w-6 text-[#9CA3AF]" />
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
              Book {artist.stage_name}
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Estimated fee: {formatNaira(artist.estimated_rate)}
            </p>
          </div>
        </div>

        <p className="mt-6 text-sm text-[#6B7280]">
          Booking through AuraPass keeps the whole conversation, the agreed fee and the
          paperwork in one place — no chasing DMs, no surprises on show day, and the
          artist sees your event details up front.
        </p>

        <Card className="mt-6 space-y-4 p-6" style={{ borderRadius: 12 }}>
          <div>
            <label className="text-sm font-medium text-[#374151]">Event name *</label>
            <Input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="e.g. Tolu & Ada's wedding reception"
              className="mt-1"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-[#374151]">Event date *</label>
              <Input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#374151]">Event type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="mt-1 h-10 w-full rounded-md border border-[#E5E7EB] bg-white px-3 text-sm text-[#111827] focus:border-[#D946EF] focus:outline-none"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151]">Venue / location *</label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Kwara Hotel, Ilorin"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[#374151]">
              Expected attendance (optional)
            </label>
            <Input
              type="number"
              min="0"
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              placeholder="e.g. 300"
              className="mt-1"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={submitting || artist.estimated_rate === null}
              onClick={() => submit("direct")}
            >
              Proceed at Estimated Price
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={submitting}
              onClick={() => setNegotiating((v) => !v)}
            >
              Negotiate
            </Button>
          </div>
          {artist.estimated_rate === null ? (
            <p className="text-xs text-[#6B7280]">
              This artist hasn't published an estimated rate — use Negotiate to make an offer.
            </p>
          ) : null}

          {negotiating ? (
            <div className="space-y-2 rounded-lg border border-[#F5D0FE] bg-[#FDF4FF] p-3">
              <Input
                type="number"
                min="0"
                step="5000"
                value={offer}
                onChange={(e) => setOffer(e.target.value)}
                placeholder="Your offer (₦)"
              />
              <Textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Opening note to the artist (optional)"
                maxLength={1000}
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={submitting}
                onClick={() => submit("negotiate")}
              >
                Send offer
              </Button>
            </div>
          ) : null}
        </Card>
      </div>
    </PageWrapper>
  );
}
