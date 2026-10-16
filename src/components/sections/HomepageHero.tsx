import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { HomeFeatureCarousel } from "@/components/sections/HomeFeatureCarousel";

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
      <div className="mx-auto max-w-7xl px-4 pb-8 md:px-6 md:pb-10">
        <div className="mx-auto max-w-[620px] text-center">
          <form
            onSubmit={handleSearch}
            className="mx-auto flex h-12 w-full items-center gap-2 rounded-lg border border-border bg-background p-1 pl-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
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
            <Button
              type="submit"
              aria-label="Search"
              className="h-10 shrink-0 px-3 sm:px-5"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </form>
          <p className="mt-5 text-[10px] font-semibold uppercase text-primary">Access the moment</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground md:text-[32px]">Explore the Raves. Enjoy the Experience.</h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground md:text-sm">Discover the biggest events across Nigeria and create memories.</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button asChild variant="primary" className="px-4 text-xs"><Link to="/events">Explore Events</Link></Button>
            <Button variant="secondary" className="px-4 text-xs" onClick={handleCreateEvent}>Create an Event</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
