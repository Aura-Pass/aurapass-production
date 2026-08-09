/**
 * Unified dashboard shell.
 *
 * Single layout for every logged-in user. The sidebar renders sections
 * conditionally from `activeRoles` (source of truth: the user_roles table),
 * NOT from the legacy `profiles.role` column.
 */
import { useEffect, useState } from "react";
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
  Menu,
  X,
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

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { activeRoles } = useAuth();

  // Every logged-in user is an attendee by default (per backfill).
  const roles = activeRoles.length ? activeRoles : ["attendee"];
  const visible = SECTIONS.filter((s) => s.role === null || roles.includes(s.role));

  return (
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
                onClick={onNavigate}
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
  );
}

function DashboardShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the drawer on any route change (belt & braces with per-link onNavigate).
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock the underlying page scroll while the mobile drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10">
          {/* Mobile-only header with hamburger */}
          <div className="mb-4 flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open dashboard menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#111827]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-[#111827]">Dashboard menu</span>
          </div>

          {/* Sidebar + content wrapper — sticky is scoped to this element so the
              sidebar naturally stops before the site footer. */}
          <div className="items-start gap-6 md:grid md:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden md:sticky md:top-16 md:block md:h-[calc(100vh-4rem)] md:self-start md:overflow-y-auto md:py-2">
              <Card className="p-2" style={{ borderRadius: 12 }}>
                <SidebarNav />
              </Card>
            </aside>

            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </div>

      {/* Mobile overlay drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-[#111827]">Dashboard</span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close dashboard menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#111827] hover:bg-[#F3F4F6]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      ) : null}
    </PageWrapper>
  );
}

