import { Link } from "@tanstack/react-router";
import { EVENT_CATEGORIES } from "@/constants";

export function EventCategories() {
  return (
    <section className="bg-[#F9FAFB] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
            Browse by Category
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Find your scene — whatever you're into.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {EVENT_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to="/events"
              search={{ category: c.slug }}
              className="group relative block overflow-hidden rounded-xl"
            >
              <div className="relative aspect-square w-full">
                <img
                  src={c.image}
                  alt={c.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-colors duration-300 group-hover:from-[#D946EF]/80 group-hover:via-[#D946EF]/20" />
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <span className="text-sm font-semibold text-white md:text-base">
                    {c.label}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
