import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AttendeeSidebar } from "./dashboard.attendee";

export const Route = createFileRoute("/dashboard/attendee/saved")({
  head: () => ({ meta: [{ title: "Saved Events | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["attendee", "admin"]}>
      <AttendeeSavedPage />
    </ProtectedRoute>
  ),
});

function AttendeeSavedPage() {
  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
          <div className="grid gap-6 md:grid-cols-[220px_1fr]">
            <AttendeeSidebar />
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">
                  Saved Events
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  Events you save will appear here.
                </p>
              </div>
              <Card
                className="flex flex-col items-center justify-center gap-4 p-10 text-center"
                style={{ borderRadius: 12 }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF4FF]">
                  <Heart className="h-6 w-6 text-[#D946EF]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#111827]">
                    No saved events yet
                  </p>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Events you save will appear here.
                  </p>
                </div>
                <Button asChild variant="primary">
                  <Link to="/events">Discover Events</Link>
                </Button>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
