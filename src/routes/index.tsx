import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { HomepageHero } from "@/components/sections/HomepageHero";
import { FeaturedEvents } from "@/components/sections/FeaturedEvents";
import { EventCategories } from "@/components/sections/EventCategories";
import { OrganizerCTA } from "@/components/sections/OrganizerCTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuraPass — Access The Moment | Event Discovery & Ticketing in Nigeria" },
      {
        name: "description",
        content:
          "Discover and book concerts, conferences, festivals and more across Nigeria. Get your tickets in seconds with AuraPass.",
      },
      { property: "og:title", content: "AuraPass — Access The Moment" },
      {
        property: "og:description",
        content: "Nigeria's modern home for event discovery and ticketing.",
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
