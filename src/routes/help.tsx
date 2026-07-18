import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Centre | AuraPass" },
      { name: "description", content: "Answers to common questions about AuraPass." },
    ],
  }),
  component: HelpPage,
});

function FAQ({ q, a }: { q: string; a: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
      <h3 className="font-semibold text-[#111827]">{q}</h3>
      <div className="mt-2 text-sm text-[#374151]">{a}</div>
    </div>
  );
}

function HelpPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Help Centre
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            Quick answers to the most common questions.
          </p>

          <div className="mt-8 space-y-4">
            <FAQ
              q="How do I get my ticket?"
              a="After purchase, your QR ticket is emailed to the address you provided at checkout. Check your inbox (and spam folder). You can also view all your tickets by logging in and going to My Tickets."
            />
            <FAQ
              q="I can't find my QR code — what do I do?"
              a={
                <>
                  Log in to your account and open{" "}
                  <Link to="/dashboard/attendee/tickets" className="text-[#D946EF] hover:underline">
                    My Tickets
                  </Link>
                  . Every ticket you've purchased is stored there with a scannable QR code.
                </>
              }
            />
            <FAQ
              q="How do I get a refund?"
              a="Tickets are non-refundable except when the event is officially cancelled by the organiser. If an event is cancelled, refunds are processed within 7–14 business days to the original payment method."
            />
            <FAQ
              q="How do I create an event?"
              a={
                <>
                  Sign up for an organiser account, then go to your dashboard and click Create
                  Event. Events are reviewed by our team before going live.{" "}
                  <Link to="/signup" className="text-[#D946EF] hover:underline">
                    Get started
                  </Link>
                  .
                </>
              }
            />
            <FAQ
              q="When do I get paid as an organiser?"
              a="Payouts are processed after your event concludes. You receive the full ticket price — the buyer covers the service fee."
            />
            <FAQ
              q="Still stuck?"
              a={
                <>
                  Email us at{" "}
                  <a href="mailto:support@aurapassticket.com" className="text-[#D946EF] hover:underline">
                    support@aurapassticket.com
                  </a>{" "}
                  and we'll get back to you within 24 hours.
                </>
              }
            />
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
