import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog | AuraPass" },
      {
        name: "description",
        content:
          "Stories, guides, and behind-the-scenes coverage of Nigeria's concerts, festivals, and live culture from the AuraPass team.",
      },
      { property: "og:title", content: "AuraPass Blog — Nigerian Live Culture" },
      {
        property: "og:description",
        content:
          "Stories, guides, and behind-the-scenes coverage of Nigeria's concerts, festivals, and live culture from the AuraPass team.",
      },
      { property: "og:url", content: "https://aurapassticket.com/blog" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://aurapassticket.com/blog" }],
  }),
  component: BlogPage,
});

function BlogPage() {
  return (
    <PageWrapper>
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Blog</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Coming soon
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Stories, guides, and behind-the-scenes from Nigeria's live events scene.
            Check back shortly.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
