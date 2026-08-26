import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Globe, Instagram, Twitter, Calendar, MapPin } from "lucide-react";
import type { Profile, Event } from "@/types";
import { FollowButton } from "@/components/ui/FollowButton";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";

export const Route = createFileRoute("/organisers/$username")({
  head: ({ params }) => {
    const clean = params.username.replace(/^@/, "");
    const url = `https://aurapassticket.com/organisers/${clean}`;
    return {
      meta: [
        { title: `@${clean} — Organiser Profile | AuraPass` },
        {
          name: "description",
          content: `View upcoming events, bio, and social links for @${clean} on AuraPass — Nigeria's modern event ticketing platform.`,
        },
        { property: "og:title", content: `@${clean} on AuraPass` },
        {
          property: "og:description",
          content: `Upcoming events and profile for @${clean} on AuraPass.`,
        },
        { property: "og:url", content: url },
        { property: "og:type", content: "profile" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            url,
            mainEntity: {
              "@type": "Person",
              name: `@${clean}`,
              alternateName: clean,
              url,
            },
          }),
        },
      ],
    };
  },
  component: OrganiserProfilePage,
});

function OrganiserProfilePage() {
  const { username } = Route.useParams();
  const { profile: currentUser } = useAuth();
  const [organiser, setOrganiser] = useState<Profile | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      const cleanUsername = username.replace(/^@/, "");
      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("username", cleanUsername)
        .in("role", ["organiser", "admin"])
        .maybeSingle();

      if (!active) return;
      if (!profile) {
        setOrganiser(null);
        setLoading(false);
        return;
      }
      setOrganiser(profile as Profile);

      const { data: eventData } = await (supabase as any)
        .from("events")
        .select("*, ticket_types(*)")
        .eq("organiser_id", profile.id)
        .eq("status", "published")
        .order("event_date", { ascending: true });

      if (!active) return;
      setEvents((eventData as Event[] | null) ?? []);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [username]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!organiser) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Organiser not found</h1>
          <p className="mt-2 text-muted-foreground">
            This profile doesn't exist or is no longer active.
          </p>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/events">Discover Events</Link>
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const upcomingEvents = events.filter((e) => e.event_date >= today);
  const pastEvents = events.filter((e) => e.event_date < today);

  const initials =
    organiser.username?.slice(0, 2).toUpperCase() ??
    organiser.full_name.slice(0, 2).toUpperCase();

  return (
    <PageWrapper>
      <div className="bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12 space-y-10">
          {/* Profile Header */}
          <Card className="p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:text-left">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-full bg-brand-tint md:h-28 md:w-28">
                {organiser.avatar_url ? (
                  <img
                    src={organiser.avatar_url}
                    alt={organiser.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-brand-hover">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex flex-col items-center gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground md:text-3xl">
                      {organiser.full_name}
                    </h1>
                    {organiser.username && (
                      <p className="mt-1 text-sm font-medium text-brand-hover">
                        @{organiser.username}
                      </p>
                    )}
                  </div>
                  {currentUser?.id !== organiser.id && (
                    <FollowButton organiserId={organiser.id} />
                  )}
                </div>
                {organiser.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {organiser.bio}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap justify-center gap-2 md:justify-start">
                  {organiser.website_url && (
                    <a
                      href={organiser.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Globe className="h-3.5 w-3.5" /> Website
                    </a>
                  )}
                  {organiser.instagram_url && (
                    <a
                      href={organiser.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Instagram className="h-3.5 w-3.5" /> Instagram
                    </a>
                  )}
                  {organiser.twitter_url && (
                    <a
                      href={organiser.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                    >
                      <Twitter className="h-3.5 w-3.5" /> Twitter/X
                    </a>
                  )}
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  {upcomingEvents.length} upcoming event
                  {upcomingEvents.length !== 1 ? "s" : ""} · {events.length} total
                  event{events.length !== 1 ? "s" : ""}
                  <FollowerCountInline organiserId={organiser.id} />
                </p>
              </div>
            </div>
          </Card>

          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-foreground">
                Upcoming Events
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </section>
          )}

          {/* Past Events */}
          {pastEvents.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-bold text-foreground">Past Events</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} past />
                ))}
              </div>
            </section>
          )}

          {events.length === 0 && (
            <Card className="p-10 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                No published events yet
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Check back soon!</p>
            </Card>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

function EventCard({ event, past = false }: { event: Event; past?: boolean }) {
  const dateStr = new Date(event.event_date).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug ?? event.id }}
      className={`group block overflow-hidden rounded-xl border border-border bg-background transition hover:shadow-md ${
        past ? "opacity-75" : ""
      }`}
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-accent">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl">
            🎟️
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-1 font-semibold text-foreground">
          {event.title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          {dateStr}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="line-clamp-1">
            {event.venue}, {event.city}
          </span>
        </div>
      </div>
    </Link>
  );
}

function FollowerCountInline({ organiserId }: { organiserId: string }) {
  const { followerCount } = useFollow(organiserId);
  return (
    <>
      {" · "}
      {followerCount} follower{followerCount !== 1 ? "s" : ""}
    </>
  );
}
