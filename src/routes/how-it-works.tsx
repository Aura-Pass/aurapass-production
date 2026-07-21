import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works | AuraPass" },
      { name: "description", content: "How AuraPass works for attendees and organisers." },
    ],
  }),
  component: HowItWorksPage,
});

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-white p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D946EF] text-sm font-bold text-white">
        {n}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[#111827]">{title}</h3>
      <p className="mt-1 text-sm text-[#6B7280]">{desc}</p>
    </div>
  );
}

function HowItWorksPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  function handleCreateEvent() {
    if (!user) {
      navigate({ to: "/signup" });
      return;
    }
    if (profile?.role === "organiser" || profile?.role === "admin") {
      navigate({ to: "/dashboard/organiser/create-event" });
    } else {
      navigate({ to: "/dashboard/attendee/settings" });
    }
  }

  return (
    <PageWrapper>
      <div className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-4xl">
            How AuraPass Works
          </h1>
          <p className="mt-2 text-sm text-[#6B7280] md:text-base">
            Simple ticketing for Nigeria's best events.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-[#111827]">For attendees</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Step n={1} title="Discover events" desc="Browse concerts, parties, conferences and more across Nigeria." />
            <Step n={2} title="Buy tickets" desc="Pay securely with card or bank transfer via Paystack." />
            <Step n={3} title="Show QR at gate" desc="Your QR ticket arrives by email. Show it at the door — done." />
          </div>

          <h2 className="mt-12 text-xl font-semibold text-[#111827]">For organisers</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <Step n={1} title="Create event" desc="Add your event details, banner, and ticket tiers." />
            <Step n={2} title="Get approved" desc="Our team reviews your event within 24 hours." />
            <Step n={3} title="Sell tickets" desc="Share your event link. Track sales in real time." />
            <Step n={4} title="Get paid" desc="Payouts land in your bank after the event concludes." />
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCreateEvent}
              className="rounded-lg bg-[#D946EF] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              Create an event
            </button>
            <Link
              to="/events"
              className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#111827] hover:border-[#D946EF]"
            >
              Discover events
            </Link>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
