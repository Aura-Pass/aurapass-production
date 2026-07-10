import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BecomeOrganiserCard } from "@/components/attendee/BecomeOrganiserCard";
import { useAuth } from "@/hooks/useAuth";
import { AttendeeSidebar } from "./dashboard.attendee";

export const Route = createFileRoute("/dashboard/attendee/settings")({
  head: () => ({ meta: [{ title: "Settings | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeSettingsPage />
    </ProtectedRoute>
  ),
});

function AttendeeSettingsPage() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <AttendeeSidebar />
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                  Settings
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Manage your account and access.
                </p>
              </div>
              <BecomeOrganiserCard
                fullName={profile?.full_name ?? ""}
                email={email ?? ""}
              />
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
