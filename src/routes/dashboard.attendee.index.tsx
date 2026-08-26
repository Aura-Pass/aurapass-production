import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { useFollowedOrganisers } from "@/hooks/useFollowedOrganisers";
import { useLeaderboard } from "@/hooks/useLeaderboard";

export const Route = createFileRoute("/dashboard/attendee/")({
  head: () => ({ meta: [{ title: "My Dashboard | AuraPass" }] }),
  component: AttendeeOverview,
});

function AttendeeOverview() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);
  const { organisers, loading: followLoading } = useFollowedOrganisers();
  const { partyMonster, crowdControl } = useLeaderboard();
  const myPMRank = partyMonster.find((e) => e.id === profile?.id);
  const myCCRank = crowdControl.find((e) => e.id === profile?.id);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tickets.filter((t) => {
      if (!t.event?.event_date) return false;
      return new Date(t.event.event_date) >= today;
    }).length;
  }, [tickets]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Welcome back, {profile?.username ? `@${profile.username}` : (profile?.full_name?.split(" ")[0] ?? "there")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's a snapshot of your activity on AuraPass.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/attendee/tickets" className="group block">
          <Card
            className="p-5 border border-border transition-all hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
            style={{ borderRadius: 12 }}
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              My Tickets
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">
              {loading ? "—" : String(tickets.length)}
            </p>
          </Card>
        </Link>
        <Stat label="Following" value={followLoading ? "—" : String(organisers.length)} />
        <Stat label="Upcoming Events" value={loading ? "—" : String(upcomingCount)} />
      </div>

      {(myPMRank || myCCRank) && (
        <section className="rounded-2xl border border-brand-tint bg-gradient-to-br from-brand-tint to-white p-5">
          <h2 className="text-sm font-bold text-foreground">🏆 Your Tier List Rankings This Month</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {myPMRank && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">🎉 Party Monster</p>
                <p className="mt-1 text-2xl font-bold text-primary">#{myPMRank.rank}</p>
                <p className="text-xs text-muted-foreground">{myPMRank.events_this_month} events</p>
              </div>
            )}
            {myCCRank && (
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">👥 Crowd Control</p>
                <p className="mt-1 text-2xl font-bold text-primary">#{myCCRank.rank}</p>
                <p className="text-xs text-muted-foreground">{myCCRank.group_orders_count} group orders</p>
              </div>
            )}
          </div>
          <Link to="/leaderboard" className="mt-3 inline-block text-sm font-semibold text-brand-hover hover:underline">
            View full leaderboard →
          </Link>
        </section>
      )}

      {organisers.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">
            Organisers You Follow
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organisers.map((org) => (
              <Link
                key={org.id}
                to="/organisers/$username"
                params={{ username: org.username ?? org.id }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition hover:border-primary hover:shadow-md"
              >
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-brand-tint">
                  {org.avatar_url ? (
                    <img
                      src={org.avatar_url}
                      alt={org.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-bold text-brand-hover">
                      {(org.username ?? org.full_name).slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {org.username ? `@${org.username}` : org.full_name}
                  </p>
                  {org.upcomingEventCount > 0 && (
                    <p className="text-xs text-brand-hover">
                      {org.upcomingEventCount} upcoming
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </Card>
  );
}
