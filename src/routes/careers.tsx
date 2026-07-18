import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/careers")({
  head: () => ({
    meta: [
      { title: "Careers | AuraPass" },
      { name: "description", content: "Careers at AuraPass — coming soon." },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6 md:py-28 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#D946EF]">Careers</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Coming soon
          </h1>
          <p className="mt-4 text-sm text-[#6B7280]">
            We're not actively hiring yet, but we'd love to hear from talented people who
            care about live culture. Email{" "}
            <a href="mailto:support@aurapassticket.com" className="text-[#D946EF] hover:underline">
              support@aurapassticket.com
            </a>{" "}
            with your CV.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
