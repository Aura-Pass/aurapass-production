import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { HomeFeatureCarousel } from "@/components/sections/HomeFeatureCarousel";
import { HomeHeroVideo } from "@/components/sections/HomeHeroVideo";
import { EVENT_CATEGORIES } from "@/constants";

export function HomepageHero() {
  const [query, setQuery] = useState<string>("");
  const navigate = useNavigate();
  const { user, activeRoles } = useAuth();

  function handleCreateEvent() {
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }
    if (activeRoles.includes("organiser") || activeRoles.includes("admin")) {
      navigate({ to: "/dashboard/organiser/create-event" });
    } else {
      navigate({ to: "/dashboard/attendee/settings" });
    }
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      navigate({ to: "/events" });
      return;
    }
    navigate({ to: "/events", search: { q } });
  }

  return (
    <section className="relative overflow-hidden bg-background">
      <HomeFeatureCarousel />
      <div className="home-hero-block mx-auto max-w-7xl px-4 md:px-6">
        <div className="relative mx-auto max-w-[680px] text-center">
          <form
            onSubmit={handleSearch}
            className="mx-auto flex h-12 w-full max-w-[620px] items-center gap-2 rounded-lg border border-border bg-background p-1 pl-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="home-event-search" className="sr-only">Search events, artists, venues</label>
            <input
              id="home-event-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="flex-1 min-w-0 bg-transparent py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none md:text-sm"
            />
            <Button type="submit" aria-label="Search" className="h-10 shrink-0 px-3 sm:px-5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
        </div>
        <div className="home-hero-intro mt-3">
          <HomeHeroVideo />
          <div className="home-hero-copy">
          <nav aria-label="Quick categories" className="home-chips">
            {QUICK_CATEGORIES.map((c) => (
              <Link key={c.slug} to="/events" search={{ category: c.slug }} className="home-chip">
                {c.label}
              </Link>
            ))}
          </nav>
          <span className="home-eyebrow mt-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Access the moment
          </span>
          <h1 className="home-headline mt-3 text-foreground">
            <span className="block">Explore the Raves.</span>
            <span className="home-headline-accent block">Enjoy the Experience.</span>
          </h1>
          <p className="home-hero-subtitle mt-3 max-w-[480px] text-sm leading-relaxed text-muted-foreground md:text-base">
            Tickets, artists, gear and merch: everything for your next night out, in one place.
          </p>
          <div className="home-hero-actions mt-6 flex items-center gap-3">
            <Button asChild variant="primary" className="home-cta-primary px-5"><Link to="/events">Explore Events</Link></Button>
            <Button variant="secondary" className="home-cta-secondary px-5" onClick={handleCreateEvent}>Create an Event</Button>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const QUICK_SLUGS = ["party", "music", "comedy", "arts", "sports", "gaming"];
const QUICK_CATEGORIES = EVENT_CATEGORIES.filter((c) => QUICK_SLUGS.includes(c.slug));
