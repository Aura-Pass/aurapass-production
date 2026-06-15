import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Ticket, Heart, Settings } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/attendee")({
  head: () => ({ meta: [{ title: "Dashboard — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeDashboard />
    </ProtectedRoute>
  ),
});

const NAV = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My Tickets", icon: Ticket },
  { label: "Saved Events", icon: Heart },
  { label: "Settings", icon: Settings },
];

function AttendeeDashboard() {
  const { profile } = useAuth();
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-20 md:self-start">
              <Card className="p-2" style={{ borderRadius: 12 }}>
                <nav className="flex flex-col gap-1">
                  {NAV.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.label}
                        type="button"
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#FDF4FF] hover:text-[#D946EF]"
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
                  Welcome back, {profile?.full_name || "there"}
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Here's a snapshot of your activity on AuraPass.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="My Tickets" value="0" />
                <Stat label="Saved Events" value="0" />
                <Stat label="Upcoming Events" value="0" />
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
