import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Zap, BarChart3, QrCode } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/for-organisers")({
  head: () => ({
    meta: [
      { title: "For Organisers | AuraPass" },
      {
        name: "description",
        content:
          "Sell tickets to your events in minutes. Create an event, set prices, and get paid — no setup fees.",
      },
      { property: "og:title", content: "For Organisers | AuraPass" },
      {
        property: "og:description",
        content: "Sell tickets to your events in minutes with AuraPass.",
      },
    ],
  }),
  component: ForOrganisersPage,
});

const FEATURES = [
  {
    icon: Zap,
    title: "Create in minutes",
    body: "Set up your event, add ticket tiers, and publish — no back-and-forth.",
  },
  {
    icon: BarChart3,
    title: "Real-time sales dashboard",
    body: "Track ticket sales, revenue, and check-ins as they happen.",
  },
  {
    icon: QrCode,
    title: "QR check-in at the gate",
    body: "Scan attendee QR codes from any phone. Fast, offline-friendly entry.",
  },
];

function ForOrganisersPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  function handleStartSelling() {
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
      <section className="relative overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, rgba(217,70,239,0.20) 0%, rgba(217,70,239,0.08) 40%, rgba(255,255,255,0) 75%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] md:text-5xl">
            Sell tickets to your events in minutes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#6B7280] md:text-lg">
            Create an event, set your ticket prices, and get paid. No setup fees.
          </p>
          <div className="mt-8">
            <Button variant="primary" size="lg" onClick={handleStartSelling}>
              Start Selling Tickets
            </Button>
          </div>
        </div>
      </section>

      <section className="bg-[#F9FAFB] py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-6"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#FDF4FF] text-[#D946EF]">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[#111827]">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm text-[#6B7280]">{f.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border-l-4 border-[#D946EF] bg-[#FDF4FF] p-8 text-center md:p-10">
            <h2 className="text-2xl font-bold text-[#111827] md:text-3xl">
              Ready to get started?
            </h2>
            <p className="mt-2 text-sm text-[#6B7280] md:text-base">
              Join organisers running successful events across Nigeria.
            </p>
            <div className="mt-6">
              <Button variant="primary" size="lg" onClick={handleStartSelling}>
                Start Selling Tickets
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
}
