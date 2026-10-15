import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { OrganiserBackButton } from "@/components/organiser/OrganiserBackButton";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";

export const Route = createFileRoute("/dashboard/organiser/tickets")({
  head: () => ({ meta: [
    { title: "My Tickets | AuraPass" },
    { name: "description", content: "View your purchased AuraPass tickets and admission QR codes." },
    { property: "og:title", content: "My Tickets | AuraPass" },
    { property: "og:description", content: "View your purchased AuraPass tickets and admission QR codes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserTicketsPage />
    </ProtectedRoute>
  ),
});

function OrganiserTicketsPage() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  return (
    <>
      <div className="bg-muted min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Tickets</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Tickets you've purchased as an attendee. Tap an event to reveal QR codes.
              </p>
            </div>
            <OrganiserBackButton variant="outline" fallback="/dashboard/organiser" />
          </div>
          <div className="mt-6">
            <MyTicketsList
              tickets={tickets}
              loading={loading}
              emptyCta={
                <Button asChild variant="primary">
                  <Link to="/events">Discover Events</Link>
                </Button>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
