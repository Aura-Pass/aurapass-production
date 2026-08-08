/**
 * Unified dashboard shell.
 *
 * Single layout for every logged-in user. The sidebar renders sections
 * conditionally from `activeRoles` (source of truth: the user_roles table),
 * NOT from the legacy `profiles.role` column.
 */
import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Ticket,
  Heart,
  Users,
  Settings,
  CalendarDays,
  WalletCards,
  ScanLine,
  ClipboardList,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  component: () => (
    <ProtectedRoute>
      <DashboardShell />
    </ProtectedRoute>
  ),
});

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavSection {
  role: string | null; // null = always visible
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    role: null,
    label: "",
    items: [{ to: "/dashboard/attendee", label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    role: "attendee",
    label: "Attendee",
    items: [
      { to: "/dashboard/attendee/tickets", label: "My Tickets", icon: Ticket },
      { to: "/dashboard/attendee/following", label: "Following", icon: Users },
      { to: "/dashboard/attendee/saved", label: "Saved Events", icon: Heart },
    ],
  },
  {
    role: "organiser",
    label: "Organiser",
    items: [
      { to: "/dashboard/organiser/events", label: "My Events", icon: CalendarDays },
      { to: "/dashboard/organiser/sales", label: "Sales & Analytics", icon: WalletCards },
      { to: "/dashboard/organiser/scan", label: "Ticket Scanner", icon: ScanLine, exact: true },
    ],
  },
  {
    role: "admin",
    label: "Admin",
    items: [
      { to: "/dashboard/admin", label: "Moderation Queue", icon: ClipboardList, exact: true },
      { to: "/dashboard/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
      { to: "/dashboard/admin/users", label: "User Management", icon: ShieldCheck },
    ],
  },
  {
    role: null,
    label: "",
    items: [{ to: "/dashboard/attendee/settings", label: "Settings", icon: Settings }],
  },
];

function DashboardSidebar() {
  const { pathname } = useLocation();
  const { activeRoles } = useAuth();

  // Every logged-in user is an attendee by default (per backfill).
  const roles = activeRoles.length ? activeRoles : ["attendee"];
  const visible = SECTIONS.filter((s) => s.role === null || roles.includes(s.role));

  return (
    <aside className="md:sticky md:top-20 md:self-start">
      <Card className="p-2" style={{ borderRadius: 12 }}>
        <nav className="flex flex-col gap-1">
          {visible.map((section, i) => (
            <div key={`${section.label}-${i}`} className="flex flex-col gap-1">
              {section.label ? (
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = item.exact
                  ? pathname === item.to || pathname === `${item.to}/`
                  : pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#FDF4FF] text-[#D946EF]"
                        : "text-[#6B7280] hover:bg-[#FDF4FF] hover:text-[#D946EF]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </Card>
    </aside>
  );
}

function DashboardShell() {
  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <DashboardSidebar />
            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
