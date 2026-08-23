/** Public equipment lister route group — renders the profile index or child routes. */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/equipment-listers/$id")({
  component: () => <Outlet />,
});
