/** Public artist route group — renders the profile index or booking child route. */
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/artists/$id")({
  component: Outlet,
});