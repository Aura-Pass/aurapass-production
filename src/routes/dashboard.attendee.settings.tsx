import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BecomeOrganiserCard } from "@/components/attendee/BecomeOrganiserCard";
import { useAuth } from "@/hooks/useAuth";

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
    <div className="space-y-6">
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
    </div>
  );
}
