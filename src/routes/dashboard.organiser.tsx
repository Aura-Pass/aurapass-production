import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { CalendarDays, LayoutDashboard, Settings, Ticket, WalletCards } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser")({
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserDashboardLayout />
    </ProtectedRoute>
  ),
});

const organiserLinks = [
  { to: "/dashboard/organiser", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/organiser/events", label: "Events", icon: CalendarDays, exact: false },
  { to: "/dashboard/organiser/sales", label: "Sales", icon: WalletCards, exact: false },
  { to: "/dashboard/organiser/tickets", label: "My Tickets", icon: Ticket, exact: false },
  { to: "/dashboard/organiser/settings", label: "Settings", icon: Settings, exact: false },
] as const;

function OrganiserSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="md:sticky md:top-20 md:self-start">
      <Card className="p-2" style={{ borderRadius: 12 }}>
        <nav className="flex flex-col gap-1">
          {organiserLinks.map((link) => {
            const Icon = link.icon;
            const active = link.exact
              ? pathname === link.to || pathname === `${link.to}/`
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

function OrganiserDashboardLayout() {
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <OrganiserSidebar />
            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
