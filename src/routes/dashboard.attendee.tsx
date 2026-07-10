import { useMemo } from "react";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, Ticket, Heart, Settings } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/attendee")({
  head: () => ({ meta: [{ title: "My Dashboard | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeDashboard />
    </ProtectedRoute>
  ),
});

const sidebarLinks = [
  { to: "/dashboard/attendee", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/attendee/tickets", label: "My Tickets", icon: Ticket, exact: false },
  { to: "/dashboard/attendee/saved", label: "Saved Events", icon: Heart, exact: false },
  { to: "/dashboard/attendee/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AttendeeSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="md:sticky md:top-20 md:self-start">
      <Card className="p-2" style={{ borderRadius: 12 }}>
        <nav className="flex flex-col gap-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const active = link.exact
              ? pathname === link.to
              : pathname === link.to || pathname.startsWith(link.to + "/");
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#FDF4FF] text-[#D946EF]"
                    : "text-[#6B7280] hover:bg-[#FDF4FF] hover:text-[#D946EF]",
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </Card>
    </aside>
  );
}

function AttendeeDashboard() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  const upcomingCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tickets.filter((t) => {
      if (!t.event?.event_date) return false;
      return new Date(t.event.event_date) >= today;
    }).length;
  }, [tickets]);

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <AttendeeSidebar />

            <section className="space-y-8">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                  Welcome back, {profile?.full_name || "there"}
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Here's a snapshot of your activity on AuraPass.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link to="/dashboard/attendee/tickets" className="group block">
                  <Card
                    className="p-5 border border-[#E5E7EB] transition-all hover:border-[#D946EF] hover:-translate-y-0.5 hover:shadow-md"
                    style={{ borderRadius: 12 }}
                  >
                    <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">
                      My Tickets
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#111827]">
                      {loading ? "—" : String(tickets.length)}
                    </p>
                  </Card>
                </Link>
                <Stat label="Saved Events" value="0" />
                <Stat label="Upcoming Events" value={loading ? "—" : String(upcomingCount)} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#111827]">My Tickets</h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Tap an event to reveal your QR codes.
                </p>

                <div className="mt-4">
                  <MyTicketsList
                    tickets={tickets}
                    loading={loading}
                    emptyCta={
                      <Button asChild variant="primary">
                        <Link to="/events">Discover Events</Link>
                      </Button>
                    }
                  />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5" style={{ borderRadius: 12 }}>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
    </Card>
  );
}
