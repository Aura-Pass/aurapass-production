import type { ComponentProps } from "react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

type Props = Omit<ComponentProps<typeof Button>, "asChild" | "onClick"> & {
  fallback?: "/dashboard/organiser" | "/dashboard/organiser/events";
};

export function OrganiserBackButton({ fallback = "/dashboard/organiser/events", children = "Back", ...props }: Props) {
  const router = useRouter();
  return <Button {...props} type="button" onClick={() => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else if (fallback === "/dashboard/organiser/events") {
      void router.navigate({ to: fallback, search: { filter: "all" } });
    } else {
      void router.navigate({ to: fallback });
    }
  }}>{children}</Button>;
}