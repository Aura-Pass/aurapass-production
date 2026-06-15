import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  "No setup fees for free events",
  "Real-time sales dashboard",
  "QR ticket scanning",
  "Paystack-powered payments",
];

export function OrganizerCTA() {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div
          className="grid gap-8 rounded-2xl border-l-4 border-[#D946EF] p-8 md:grid-cols-2 md:p-12"
          style={{ backgroundColor: "#FDF4FF" }}
        >
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#111827] md:text-3xl">
              Are you an event organiser?
            </h2>
            <p className="mt-3 text-base text-[#6B7280]">
              Sell tickets, manage your events, and get paid — all in one place.
            </p>
            <div className="mt-6">
              <Button asChild variant="primary" size="lg">
                <Link to="/signup">Start Selling Tickets</Link>
              </Button>
            </div>
          </div>
          <ul className="grid gap-3 self-center">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D946EF] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm font-medium text-[#111827]">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
