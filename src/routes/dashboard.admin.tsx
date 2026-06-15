import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Users, CalendarDays, Receipt, Settings } from "lucide-react";

export const Route = createFileRoute("/dashboard/admin")({
  head: () => ({ meta: [{ title: "Admin — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

const SECTIONS = [
  { label: "Organisers", desc: "Review and approve organiser accounts", icon: Users },
  { label: "Events", desc: "Moderate events on the platform", icon: CalendarDays },
  { label: "Orders", desc: "View ticket sales and refunds", icon: Receipt },
  { label: "Platform Settings", desc: "Configure fees and policies", icon: Settings },
];

function AdminDashboard() {
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Admin Panel</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Manage AuraPass operations and oversight.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="p-6" style={{ borderRadius: 12 }}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#FDF4FF] text-[#D946EF]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">{s.label}</p>
                      <p className="text-xs text-[#6B7280]">{s.desc}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
