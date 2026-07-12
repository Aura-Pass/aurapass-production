import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";

export const Route = createFileRoute("/dashboard/organiser/tickets")({
  head: () => ({ meta: [{ title: "My Tickets | AuraPass" }] }),
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
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Tickets</h1>
              <p className="mt-1 text-sm text-[#6B7280]">
                Tickets you've purchased as an attendee. Tap an event to reveal QR codes.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard/organiser">Back</Link>
            </Button>
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
