import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | AuraPass" },
      { name: "description", content: "Get in touch with the AuraPass team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Contact us
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            We're here to help attendees and organisers.
          </p>

          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#111827]">Email support</h2>
              <p className="mt-1 text-sm text-[#374151]">
                For any question, issue, or partnership enquiry:{" "}
                <a
                  href="mailto:support@aurapassticket.com"
                  className="font-semibold text-[#D946EF] hover:underline"
                >
                  support@aurapassticket.com
                </a>
              </p>
              <p className="mt-3 text-xs text-[#6B7280]">
                We typically respond within 24 hours on business days. During peak event
                weekends response times may extend to 48 hours.
              </p>
            </div>

            <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
              <h2 className="text-lg font-semibold text-[#111827]">Refund requests</h2>
              <p className="mt-1 text-sm text-[#374151]">
                Refunds are only issued when an event is officially cancelled by the
                organiser. See our{" "}
                <a href="/terms" className="text-[#D946EF] hover:underline">
                  Terms of Service
                </a>{" "}
                for details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
