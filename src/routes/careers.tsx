import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers | AuraPass" },
      {
        name: "description",
        content:
          "Careers at AuraPass. We're not actively hiring yet, but we'd love to hear from talented people who care about Nigerian live culture.",
      },
      { property: "og:title", content: "Careers at AuraPass" },
      {
        property: "og:description",
        content: "Join the team building Nigeria's modern event ticketing platform.",
      },
      { property: "og:url", content: "https://aurapassticket.com/careers" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://aurapassticket.com/careers" }],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <PageWrapper>
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Careers</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Coming soon
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            We're not actively hiring yet, but we'd love to hear from talented people who
            care about live culture. Email{" "}
            <a href="mailto:support@aurapassticket.com" className="text-primary hover:underline">
              support@aurapassticket.com
            </a>{" "}
            with your CV.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
