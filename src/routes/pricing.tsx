import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing | AuraPass" },
      { name: "description", content: "Simple, transparent pricing. No monthly fees." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] md:text-base">
            No monthly fees. No setup costs. You only pay when you sell.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#6B7280]">Free events</p>
              <p className="mt-4 text-4xl font-bold text-[#111827]">₦0</p>
              <p className="mt-2 text-sm text-[#6B7280]">Always free for free events.</p>
              <ul className="mt-6 space-y-2 text-sm text-[#374151]">
                <li>• Unlimited free tickets</li>
                <li>• QR check-in scanner</li>
                <li>• Attendee CSV export</li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-[#D946EF] bg-[#FDF4FF] p-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#D946EF]">Paid events</p>
              <p className="mt-4 text-4xl font-bold text-[#111827]">
                3.5% <span className="text-lg font-medium text-[#6B7280]">+ ₦100</span>
              </p>
              <p className="mt-2 text-sm text-[#6B7280]">
                Service fee added to each ticket, paid by the buyer. Organisers receive the full ticket price.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-[#374151]">
                <li>• Secure Paystack payments</li>
                <li>• Real-time sales dashboard</li>
                <li>• Automatic QR ticket delivery</li>
                <li>• Attendee CSV export</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-xl bg-[#F9FAFB] p-6 text-sm text-[#374151]">
            <p className="font-semibold text-[#111827]">Example</p>
            <p className="mt-1">
              You price a ticket at ₦5,000. The buyer pays ₦5,275 (₦5,000 + ₦175 fee + ₦100).
              You receive the full ₦5,000.
            </p>
          </div>

          <div className="mt-10">
            <Link
              to="/signup"
              className="rounded-lg bg-[#D946EF] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Start selling tickets
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
