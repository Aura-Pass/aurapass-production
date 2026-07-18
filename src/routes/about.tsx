import { createFileRoute } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | AuraPass" },
      { name: "description", content: "About AuraPass — Nigeria's modern event ticketing platform." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            About AuraPass
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[#374151]">
            AuraPass is Nigeria's modern event discovery and ticketing platform.
            We connect people to the moments that matter — from Afrobeats concerts
            to tech conferences, art shows, and community gatherings.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-[#111827]">Our mission</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#374151]">
            Make it effortless for anyone in Nigeria to discover, buy, and access
            live experiences — and make it easy for organisers to sell tickets and
            grow their audiences.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-[#111827]">Our vision</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#374151]">
            To become the default ticketing rail for African live culture — fast,
            fair, and built for how people actually pay and gather.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-[#111827]">Founded</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#374151]">
            AuraPass was founded in 2026 and is headquartered in Lagos, Nigeria.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-[#111827]">Contact</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#374151]">
            Reach us at{" "}
            <a href="mailto:support@aurapassticket.com" className="text-[#D946EF] hover:underline">
              support@aurapassticket.com
            </a>
            .
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
