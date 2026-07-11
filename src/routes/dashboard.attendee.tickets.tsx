import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";

export const Route = createFileRoute("/dashboard/attendee/tickets")({
  head: () => ({ meta: [{ title: "My Tickets | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeTicketsPage />
    </ProtectedRoute>
  ),
});

function AttendeeTicketsPage() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Tickets</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Tap an event to reveal your QR codes.
        </p>
      </div>
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
  );
}
