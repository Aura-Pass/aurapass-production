import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HomepageHero } from "@/components/sections/HomepageHero";
import { FeaturedEvents } from "@/components/sections/FeaturedEvents";
import { EventCategories } from "@/components/sections/EventCategories";
import { OrganizerCTA } from "@/components/sections/OrganizerCTA";

const SITE_URL = "https://aurapassticket.com";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuraPass — Event Discovery & Ticketing in Nigeria" },
      {
        name: "description",
        content:
          "Discover and book concerts, conferences, festivals and more across Nigeria. Get your tickets in seconds with AuraPass.",
      },
      { property: "og:title", content: "AuraPass — Event Discovery & Ticketing in Nigeria" },
      {
        property: "og:description",
        content:
          "Discover and book concerts, conferences, festivals and more across Nigeria. Get your tickets in seconds with AuraPass.",
      },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "AuraPass",
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.png`,
          sameAs: ["https://www.instagram.com/aurapassticket"],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "AuraPass",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/events?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PageWrapper>
      <HomepageHero />
      <FeaturedEvents />
      <EventCategories />
      <OrganizerCTA />
    </PageWrapper>
  );
}
