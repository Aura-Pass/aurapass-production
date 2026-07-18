import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog | AuraPass" },
      { name: "description", content: "The AuraPass blog — coming soon." },
    ],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D946EF]">Blog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Coming soon
          </h1>
          <p className="mt-4 text-sm text-[#6B7280]">
            Stories, guides, and behind-the-scenes from Nigeria's live events scene.
            Check back shortly.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
