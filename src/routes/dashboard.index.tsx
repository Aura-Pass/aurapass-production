import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Ticket, CalendarDays, Settings } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — AuraPass" }] }),
  component: DashboardPage,
});

const NAV = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "tickets", label: "My Tickets", icon: Ticket },
  { key: "events", label: "My Events", icon: CalendarDays },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

function DashboardPage() {
  const [active, setActive] = useState<(typeof NAV)[number]["key"]>("overview");

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-20 md:self-start">
              <Card className="p-2">
                <nav className="flex flex-col gap-1">
                  {NAV.map((n) => {
                    const Icon = n.icon;
                    const isActive = active === n.key;
                    return (
                      <button
                        key={n.key}
                        type="button"
                        onClick={() => setActive(n.key)}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[#FDF4FF] text-[#D946EF]"
                            : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {n.label}
                      </button>
                    );
                  })}
                </nav>
              </Card>
            </aside>

            <section className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                  Welcome to AuraPass
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Your dashboard is coming together. Here's a quick snapshot.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Tickets purchased" value="0" />
                <StatCard label="Upcoming events" value="0" />
                <StatCard label="Total spent" value="₦0" />
              </div>

              <Card className="p-8 text-center">
                <p className="text-sm text-[#6B7280]">
                  Activity, sales charts, and event management tools will appear here.
                </p>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#111827]">{value}</p>
    </Card>
  );
}
