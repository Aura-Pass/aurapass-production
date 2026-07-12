import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { UsernameSettings } from "@/components/settings/UsernameSettings";

export const Route = createFileRoute("/dashboard/organiser/settings")({
  head: () => ({ meta: [{ title: "Settings | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserSettingsPage />
    </ProtectedRoute>
  ),
});

function OrganiserSettingsPage() {
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage your account.
            </p>
          </div>
          <UsernameSettings />
        </div>
      </div>
    </PageWrapper>
  );
}
