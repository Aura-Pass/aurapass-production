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

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
          {EVENT_CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              className="group flex shrink-0 items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-4 py-4 text-left transition-all duration-200 hover:border-[#D946EF] hover:bg-[#FDF4FF] md:w-auto"
              style={{ minWidth: "160px" }}
            >
              <span className="text-2xl">{c.icon}</span>
              <span className="text-sm font-semibold text-[#111827] group-hover:text-[#D946EF]">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
