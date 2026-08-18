/**
 * Organiser route group — pass-through with a multi-role guard.
 * Access requires the `organiser` (or `admin`) role in user_roles.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/dashboard/organiser")({
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin", "gate_attendant"]}>
      <Outlet />
    </ProtectedRoute>
  ),
});
