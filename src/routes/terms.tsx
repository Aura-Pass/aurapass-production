import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service | AuraPass" },
      { name: "description", content: "AuraPass Terms of Service." },
    ],
  }),
  component: TermsPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[#374151]">{children}</p>
    </section>
  );
}

function TermsPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">Last updated: July 2026</p>

          <div className="mt-8 space-y-6">
            <Section title="1. Acceptance of Terms">
              By accessing or using AuraPass ("the Platform"), you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the Platform. These
              terms apply to all users including attendees, event organisers, and visitors.
            </Section>
            <Section title="2. Use of the Platform">
              AuraPass is an event discovery and ticketing marketplace operating in Nigeria.
              You must be at least 18 years old to create an account and purchase tickets.
              You are responsible for maintaining the confidentiality of your account
              credentials.
            </Section>
            <Section title="3. Ticket Purchases">
              All ticket sales are final. Tickets are non-refundable except in the event that
              an organiser officially cancels the event, in which case refunds will be
              processed within 7–14 business days to the original payment method. AuraPass
              charges a service fee of 3.5% plus ₦100 per paid ticket, which is non-refundable
              in all circumstances.
            </Section>
            <Section title="4. Event Organisers">
              Organisers are responsible for the accuracy of all event information including
              dates, venues, and ticket pricing. All events are subject to review and approval
              by AuraPass before they are listed publicly. AuraPass reserves the right to
              reject or remove any event that violates these terms or our community standards.
            </Section>
            <Section title="5. QR Tickets and Entry">
              Each ticket generates a unique QR code. QR codes are single-use — once scanned
              at the venue, the ticket is marked as used and cannot be used for re-entry.
              AuraPass is not responsible for lost, stolen, or duplicated QR codes that result
              from user action.
            </Section>
            <Section title="6. Prohibited Conduct">
              You may not resell tickets at inflated prices, use automated systems to purchase
              tickets in bulk, create fake events, or use the Platform for any fraudulent or
              illegal purpose. Violations may result in account suspension and legal action.
            </Section>
            <Section title="7. Limitation of Liability">
              AuraPass is a technology platform that facilitates transactions between buyers
              and event organisers. We are not responsible for the quality, safety, or
              delivery of events. Our liability in any circumstance is limited to the amount
              of service fees collected on the relevant transaction.
            </Section>
            <Section title="8. Governing Law">
              These terms are governed by the laws of the Federal Republic of Nigeria. Any
              disputes shall be resolved in the competent courts of Lagos State, Nigeria.
            </Section>
            <section>
              <h2 className="text-xl font-semibold text-[#111827]">9. Contact</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#374151]">
                For questions about these terms, contact us at{" "}
                <a
                  href="mailto:support@aurapassticket.com"
                  className="text-[#D946EF] hover:underline"
                >
                  support@aurapassticket.com
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
