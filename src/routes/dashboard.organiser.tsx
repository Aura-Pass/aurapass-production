import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/dashboard/organiser")({
  component: OrganiserDashboardLayout,
});

function OrganiserDashboardLayout() {
  return (
    <PageWrapper>
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <Outlet />
      </div>
    </PageWrapper>
  );
}
