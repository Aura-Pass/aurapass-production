import { createFileRoute, Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useFollowedOrganisers } from "@/hooks/useFollowedOrganisers";

export const Route = createFileRoute("/dashboard/attendee/following")({
  head: () => ({ meta: [{ title: "Following | AuraPass" }] }),
  component: FollowingPage,
});

function FollowingPage() {
  const { organisers, loading } = useFollowedOrganisers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Following</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Organisers you follow and their upcoming events.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : organisers.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <Users className="mx-auto h-8 w-8 text-[#D1D5DB]" />
          <p className="mt-3 text-sm text-[#6B7280]">
            You're not following any organisers yet.
          </p>
          <Link
            to="/events"
            search={{ category: undefined, city: undefined, date: undefined, price: undefined, q: undefined }}
            className="mt-4 inline-block text-sm font-semibold text-[#D946EF] hover:underline"
          >
            Discover events
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organisers.map((o) => (
            <Card key={o.id} className="p-5" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-3">
                {o.avatar_url ? (
                  <img
                    src={o.avatar_url}
                    alt={o.full_name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D946EF] text-sm font-semibold text-white">
                    {(o.username ?? o.full_name ?? "U").slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111827]">
                    {o.full_name}
                  </p>
                  {o.username ? (
                    <p className="truncate text-xs text-[#6B7280]">@{o.username}</p>
                  ) : null}
                </div>
              </div>
              <p className="mt-3 text-xs text-[#6B7280]">
                {o.upcomingEventCount} upcoming event
                {o.upcomingEventCount === 1 ? "" : "s"}
              </p>
              {o.username ? (
                <Link
                  to="/organisers/$username"
                  params={{ username: o.username }}
                  className="mt-3 inline-block text-sm font-semibold text-[#D946EF] hover:underline"
                >
                  View profile
                </Link>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
