import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomepageHero() {
  const [query, setQuery] = useState<string>("");


  return (
    <section className="relative overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
          "radial-gradient(60% 60% at 50% 0%, rgba(217,70,239,0.20) 0%, rgba(217,70,239,0.08) 40%, rgba(255,255,255,0) 75%)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-20 md:px-6 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[32px] font-bold leading-tight tracking-tight text-[#111827] md:text-5xl">
            Explore the Raves. Enjoy the Experience.
          </h1>
          <p className="mt-4 text-base text-[#6B7280] md:text-lg">
            Discover the biggest events across Nigeria and create memories.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="primary">
              <Link to="/events">Explore Events</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to="/dashboard">Create an Event</Link>
            </Button>
          </div>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-10 mx-auto flex w-full items-stretch overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm focus-within:border-[#D946EF] focus-within:ring-2 focus-within:ring-[#D946EF]/20"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, artists, venues..."
              className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search"
              className="flex shrink-0 items-center gap-2 bg-[#D946EF] px-3 sm:px-5 text-sm font-semibold text-white transition-colors hover:bg-[#C026D3]"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
