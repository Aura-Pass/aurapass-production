import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useMyTickets } from "@/hooks/useMyTickets";
import { MyTicketsList } from "@/components/tickets/MyTicketsList";

export const Route = createFileRoute("/dashboard/admin/tickets")({
  head: () => ({ meta: [{ title: "My Tickets | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminTicketsPage />
    </ProtectedRoute>
  ),
});

function AdminTicketsPage() {
  const { profile, user } = useAuth();
  const email = profile?.email ?? user?.email;
  const { tickets, loading } = useMyTickets(email);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">My Tickets</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Tickets you've purchased as an attendee.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/dashboard/admin">Back</Link>
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
  );
}
