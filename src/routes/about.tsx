import { createFileRoute } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About AuraPass | Nigerian Event Ticketing" },
      {
        name: "description",
        content:
          "AuraPass is Nigeria's modern event discovery and ticketing platform, connecting fans to concerts, festivals, and conferences nationwide.",
      },
      { property: "og:title", content: "About AuraPass" },
      {
        property: "og:description",
        content:
          "Nigeria's modern event discovery and ticketing platform, based in Ilorin and built for the culture.",
      },
      { property: "og:url", content: "https://aurapassticket.com/about" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://aurapassticket.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageWrapper>
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            About AuraPass
          </h1>
          <p className="mt-4 text-base leading-relaxed text-foreground-secondary">
            AuraPass is Nigeria's modern event discovery and ticketing platform.
            We connect people to the moments that matter — from Afrobeats concerts
            to tech conferences, art shows, and community gatherings.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-foreground">Our mission</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            Make it effortless for anyone in Nigeria to discover, buy, and access
            live experiences — and make it easy for organisers to sell tickets and
            grow their audiences.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-foreground">Our vision</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            To become the default ticketing rail for African live culture — fast,
            fair, and built for how people actually pay and gather.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-foreground">Founded</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            AuraPass was founded in 2026 and is headquartered in Ilorin, Kwara State, Nigeria.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-foreground">Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
            Reach us at{" "}
            <a href="mailto:support@aurapassticket.com" className="text-primary hover:underline">
              support@aurapassticket.com
            </a>
            .
          </p>
          <p className="mt-4">
            <a
              href="https://www.instagram.com/aurapassticket/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <Instagram className="h-4 w-4" />
              @aurapassticket on Instagram
            </a>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
