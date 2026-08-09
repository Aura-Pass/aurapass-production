/**
 * Artist route group — pass-through layout gated on the `artist` role.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const Route = createFileRoute("/dashboard/artist")({
  component: () => (
    <ProtectedRoute allowedRoles={["artist"]}>
      <Outlet />
    </ProtectedRoute>
  ),
});
