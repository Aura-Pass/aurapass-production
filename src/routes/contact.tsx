import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle, Instagram } from "lucide-react";
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

          <div className="mt-8 space-y-4">
            <a
              href="mailto:support@aurapassticket.com"
              className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-colors hover:border-[#D946EF]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FDF4FF] text-[#D946EF]">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Email Support</p>
                <p className="text-sm text-[#374151]">support@aurapassticket.com</p>
                <p className="text-xs text-[#6B7280]">Response within 24 hours</p>
              </div>
            </a>

            <a
              href="https://wa.me/2348131100239"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-colors hover:border-[#25D366]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#DCFCE7] text-[#25D366]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#111827]">WhatsApp Support</p>
                <p className="text-sm text-[#374151]">Chat with us on WhatsApp</p>
                <p className="text-xs text-[#6B7280]">Fastest response</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/aurapassticket/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-5 transition-colors hover:border-[#E1306C]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#FCE7F3] text-[#E1306C]">
                <Instagram className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#111827]">Instagram</p>
                <p className="text-sm text-[#374151]">@aurapassticket</p>
                <p className="text-xs text-[#6B7280]">DMs open</p>
              </div>
            </a>
          </div>

          <div className="mt-8 rounded-xl border border-[#E5E7EB] bg-white p-6">
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
    </PageWrapper>
  );
}
