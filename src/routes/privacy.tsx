import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | AuraPass" },
      { name: "description", content: "AuraPass Privacy Policy." },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-[#111827]">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-[#374151]">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-[#6B7280]">Last updated: July 2026</p>

          <div className="mt-8 space-y-6">
            <Section title="1. Information We Collect">
              We collect information you provide directly: your full name, username, email
              address, phone number, and — when purchasing paid tickets — payment details
              processed by our payment partner (Paystack). We also collect basic usage data
              such as pages visited and events viewed.
            </Section>
            <Section title="2. How We Use Your Information">
              We use your information to: (a) issue and deliver tickets, (b) send order
              confirmations and event updates, (c) enable check-in at events via QR codes,
              (d) prevent fraud, and (e) improve the Platform. We do not sell your personal
              data to third parties.
            </Section>
            <Section title="3. Data Storage and Security">
              Data is stored securely with Supabase on servers in the EU and Nigeria.
              Passwords are hashed. Payment card data is handled entirely by Paystack and
              never touches AuraPass servers. QR codes for tickets are stored in a public
              Supabase Storage bucket to enable delivery via email.
            </Section>
            <Section title="4. Sharing With Organisers">
              When you purchase a ticket, the event organiser receives your name, email,
              phone number, ticket type, and check-in status so they can operate their event.
              Organisers must handle this data responsibly and only for event purposes.
            </Section>
            <Section title="5. Your Rights">
              You have the right to access, correct, or request deletion of your personal
              data. To exercise these rights email{" "}
              <a
                href="mailto:support@aurapassticket.com"
                className="text-[#D946EF] hover:underline"
              >
                support@aurapassticket.com
              </a>
              . Note: deletion of your account will not remove records of past ticket
              purchases required for accounting and dispute resolution.
            </Section>
            <Section title="6. Cookies">
              We use essential cookies to keep you logged in and to secure the checkout
              flow. We do not use advertising or tracking cookies.
            </Section>
            <Section title="7. Children">
              AuraPass is not intended for anyone under 18. We do not knowingly collect data
              from children.
            </Section>
            <Section title="8. Changes">
              We may update this Privacy Policy from time to time. Material changes will be
              communicated by email or via a notice on the Platform.
            </Section>
            <Section title="9. Contact">
              <p>
                Privacy questions? Email{" "}
                <a
                  href="mailto:support@aurapassticket.com"
                  className="text-[#D946EF] hover:underline"
                >
                  support@aurapassticket.com
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
