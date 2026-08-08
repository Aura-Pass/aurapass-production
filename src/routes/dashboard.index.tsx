import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — AuraPass" }] }),
  component: () => <Navigate to="/dashboard/attendee" replace />,
});
