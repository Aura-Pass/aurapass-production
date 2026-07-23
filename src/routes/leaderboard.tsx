import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { Trophy, Users } from "lucide-react";
import type { PartyMonsterEntry, CrowdControlEntry } from "@/types";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Tier List | AuraPass" },
      { name: "description", content: "Monthly rankings of AuraPass's top event-goers and group organisers." },
      { property: "og:title", content: "AuraPass Tier List — Monthly Rankings" },
      { property: "og:description", content: "See who's topping the Party Monster and Crowd Control leaderboards this month." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LeaderboardPage,
});

const TIER_BADGES = ["🥇", "🥈", "🥉"];

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-2xl w-8 text-center">{TIER_BADGES[rank - 1]}</span>;
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-sm font-semibold text-[#6B7280]">
      {rank}
    </span>
  );
}

function Avatar({ entry }: { entry: { full_name: string; username: string | null; avatar_url: string | null } }) {
  return (
    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-[#FDF4FF]">
      {entry.avatar_url ? (
        <img src={entry.avatar_url} alt={entry.full_name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#A21CAF]">
          {(entry.username ?? entry.full_name).slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}

function LeaderboardPage() {
  const { partyMonster, crowdControl, loading } = useLeaderboard();
  const now = new Date();
  const monthName = now.toLocaleDateString("en-NG", { month: "long", year: "numeric" });

  return (
    <PageWrapper>
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 text-center">
          <div className="mb-3 flex items-center justify-center gap-3">
            <Trophy className="h-8 w-8 text-[#D946EF]" />
            <h1 className="text-3xl font-bold text-[#111827] md:text-4xl">Tier List</h1>
          </div>
          <p className="text-sm text-[#6B7280]">Rankings reset every month · {monthName}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#D946EF]" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">Party Monster</h2>
                  <p className="text-sm text-[#6B7280]">Most events attended this month</p>
                </div>
              </div>
              {partyMonster.length === 0 ? (
                <div className="rounded-xl bg-[#F9FAFB] p-6 text-center">
                  <p className="text-sm text-[#6B7280]">No rankings yet this month.</p>
                  <Link to="/events" className="mt-2 inline-block text-sm font-semibold text-[#D946EF] hover:underline">
                    Buy tickets to appear here →
                  </Link>
                </div>
              ) : (
                <ol className="space-y-2">
                  {partyMonster.map((entry: PartyMonsterEntry) => (
                    <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] p-3 transition hover:border-[#D946EF] hover:bg-[#FDF4FF]/30">
                      <RankBadge rank={entry.rank} />
                      <Avatar entry={entry} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#111827]">
                          {entry.username ? `@${entry.username}` : entry.full_name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {entry.events_this_month} event{entry.events_this_month !== 1 ? "s" : ""} · {entry.total_tickets_this_month} ticket{entry.total_tickets_this_month !== 1 ? "s" : ""}
                        </p>
                      </div>
                      {entry.rank === 1 && (
                        <span className="rounded-full bg-[#D946EF] px-2 py-0.5 text-xs font-bold text-white">#1</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-6">
              <div className="mb-5 flex items-start gap-3">
                <Users className="h-8 w-8 text-[#D946EF]" />
                <div>
                  <h2 className="text-xl font-bold text-[#111827]">Crowd Control</h2>
                  <p className="text-sm text-[#6B7280]">Most group ticket purchases this month</p>
                </div>
              </div>
              {crowdControl.length === 0 ? (
                <div className="rounded-xl bg-[#F9FAFB] p-6 text-center">
                  <p className="text-sm text-[#6B7280]">No group buyers yet this month.</p>
                  <Link to="/events" className="mt-2 inline-block text-sm font-semibold text-[#D946EF] hover:underline">
                    Buy group tickets to appear here →
                  </Link>
                </div>
              ) : (
                <ol className="space-y-2">
                  {crowdControl.map((entry: CrowdControlEntry) => (
                    <li key={entry.id} className="flex items-center gap-3 rounded-xl border border-[#F3F4F6] p-3 transition hover:border-[#D946EF] hover:bg-[#FDF4FF]/30">
                      <RankBadge rank={entry.rank} />
                      <Avatar entry={entry} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#111827]">
                          {entry.username ? `@${entry.username}` : entry.full_name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {entry.group_orders_count} group order{entry.group_orders_count !== 1 ? "s" : ""} · {entry.total_group_tickets} tickets total
                        </p>
                      </div>
                      {entry.rank === 1 && (
                        <span className="rounded-full bg-[#D946EF] px-2 py-0.5 text-xs font-bold text-white">#1</span>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center">
          <p className="text-sm text-[#6B7280]">
            Rankings update in real time as tickets are purchased. Buy tickets for more events this month to climb the leaderboard!
          </p>
          <Link to="/events" className="mt-3 inline-block rounded-lg bg-[#D946EF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#C026D3]">
            Discover Events
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
