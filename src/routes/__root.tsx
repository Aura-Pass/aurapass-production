import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
      <div className="max-w-md text-center">
        <h1
          className="text-[96px] leading-none font-bold text-[#D946EF] md:text-[128px]"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          404
        </h1>
        <p className="mt-4 text-base text-[#6B7280] md:text-lg">
          This page doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#D946EF] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C026D3]"
          >
            Go Home
          </Link>
          <Link
            to="/events"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition-colors hover:border-[#D946EF] hover:text-[#D946EF]"
          >
            Discover Events
          </Link>
        </div>
      </div>
    </div>
  );
}


function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AuraPass — Access The Moment | Event Discovery & Ticketing in Nigeria" },
      {
        name: "description",
        content:
          "Discover and book concerts, conferences, festivals and more across Nigeria. Get your tickets in seconds with AuraPass.",
      },
      { property: "og:site_name", content: "AuraPass" },
      { property: "og:title", content: "AuraPass — Access The Moment" },
      {
        property: "og:description",
        content: "Discover the biggest events across Nigeria. Book tickets instantly.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://aurapassticket.com/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://aurapassticket.com/og-default.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
