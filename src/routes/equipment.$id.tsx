/** Public equipment route group — renders the listing index or future child routes. */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/equipment/$id")({
  component: () => <Outlet />,
});
