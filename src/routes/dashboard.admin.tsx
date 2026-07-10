import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { ClipboardList, Ticket } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/admin")({
  component: () => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardLayout />
    </ProtectedRoute>
  ),
});

const links = [
  { to: "/dashboard/admin", label: "Moderation", icon: ClipboardList, exact: true },
  { to: "/dashboard/admin/tickets", label: "My Tickets", icon: Ticket, exact: false },
] as const;

function AdminDashboardLayout() {
  const { pathname } = useLocation();
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <aside className="md:sticky md:top-20 md:self-start">
              <Card className="p-2" style={{ borderRadius: 12 }}>
                <nav className="flex flex-col gap-1">
                  {links.map((link) => {
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
            <section className="min-w-0">
              <Outlet />
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
