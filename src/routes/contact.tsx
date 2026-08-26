import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact AuraPass | Support for Attendees & Organisers" },
      {
        name: "description",
        content:
          "Get in touch with the AuraPass team by email, WhatsApp, or Instagram. Support for attendees, organisers, and press enquiries.",
      },
      { property: "og:title", content: "Contact AuraPass" },
      {
        property: "og:description",
        content: "Email, WhatsApp, or Instagram — reach the AuraPass team.",
      },
      { property: "og:url", content: "https://aurapassticket.com/contact" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://aurapassticket.com/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <PageWrapper>
      <div className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Contact us
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We're here to help attendees and organisers.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href="mailto:support@aurapassticket.com"
              className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-primary"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Email Support</p>
                <p className="text-sm text-foreground-secondary">support@aurapassticket.com</p>
                <p className="text-xs text-muted-foreground">Response within 24 hours</p>
              </div>
            </a>

            <a
              href="https://wa.me/2348131100239"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-[#25D366]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-light text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">WhatsApp Support</p>
                <p className="text-sm text-foreground-secondary">Chat with us on WhatsApp</p>
                <p className="text-xs text-muted-foreground">Fastest response</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/aurapassticket/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-background p-5 transition-colors hover:border-[#E1306C]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-[#E1306C]">
                <Instagram className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Instagram</p>
                <p className="text-sm text-foreground-secondary">@aurapassticket</p>
                <p className="text-xs text-muted-foreground">DMs open</p>
              </div>
            </a>
          </div>

          <div className="mt-8 rounded-xl border border-border bg-background p-6">
            <h2 className="text-lg font-semibold text-foreground">Refund requests</h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Refunds are only issued when an event is officially cancelled by the
              organiser. See our{" "}
              <a href="/terms" className="text-primary hover:underline">
                Terms of Service
              </a>{" "}
              for details.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
