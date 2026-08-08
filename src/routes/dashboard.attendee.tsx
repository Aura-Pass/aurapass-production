/**
 * Attendee route group — pass-through only.
 * Layout, sidebar and auth guard live in the unified shell at /dashboard.
 * Every logged-in user has the attendee role, so no extra role gate here.
 */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/attendee")({
  component: () => <Outlet />,
});
