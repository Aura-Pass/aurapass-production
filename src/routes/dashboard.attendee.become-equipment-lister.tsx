/**
 * Become an Equipment Lister — application form + own application status view.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { EquipmentListerProfileForm } from "@/components/equipment/EquipmentListerProfileForm";
import { useMyEquipmentListerProfile } from "@/hooks/useEquipmentListerProfile";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/dashboard/attendee/become-equipment-lister")({
  head: () => ({
    meta: [
      { title: "Become an Equipment Lister | AuraPass" },
      {
        name: "description",
        content:
          "Apply to list your event equipment on AuraPass and get hired by event organisers.",
      },
      { property: "og:title", content: "Become an Equipment Lister | AuraPass" },
      {
        property: "og:description",
        content: "Apply to rent out your event equipment on AuraPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BecomeEquipmentListerPage,
});

function BecomeEquipmentListerPage() {
  const { application, loading, refetch } = useMyEquipmentListerProfile();
  const { refreshRoles } = useAuth();

  async function resubmit() {
    if (!application) return;
    const { error } = await (supabase as any).rpc("resubmit_equipment_lister_application", {
      _application_id: application.id,
    });
    if (error) {
      toast.error(error.message ?? "Could not resubmit your application.");
      return;
    }
    toast.success("Application resubmitted for review.");
    await refetch();
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Become an Equipment Lister
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          List your event equipment on AuraPass so organisers can discover and hire you.
        </p>
      </div>

      {application?.status === "pending_review" ? (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <h2 className="text-lg font-semibold text-foreground">
            Your application is under review.
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll let you know as soon as an admin has looked at{" "}
            <span className="font-medium text-foreground">{application.business_name}</span>.
          </p>
        </Card>
      ) : application?.status === "approved" ? (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <h2 className="text-lg font-semibold text-foreground">
            You're an approved equipment lister 🎉
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You can now manage your equipment listings.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="primary" size="sm" onClick={() => refreshRoles()}>
              <Link to={"/dashboard/equipment" as never}>Manage your listings</Link>
            </Button>
          </div>
        </Card>
      ) : application?.status === "rejected" ? (
        <>
          <Card className="p-6" style={{ borderRadius: 12 }}>
            <h2 className="text-lg font-semibold text-destructive-strong">Application rejected</h2>
            <p className="mt-2 whitespace-pre-wrap rounded-md bg-destructive-light px-3 py-2 text-sm text-destructive-strong">
              {application.rejection_reason ?? "No reason was provided."}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Update your details below, then resubmit for review.
            </p>
          </Card>
          <Card className="p-6" style={{ borderRadius: 12 }}>
            <EquipmentListerProfileForm
              mode="edit"
              existing={application}
              submitLabel="Save changes"
              onSaved={refetch}
            />
            <div className="mt-4 border-t border-border pt-4">
              <Button type="button" variant="primary" onClick={resubmit}>
                Resubmit for review
              </Button>
            </div>
          </Card>
        </>
      ) : (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <EquipmentListerProfileForm mode="apply" onSaved={refetch} />
        </Card>
      )}
    </div>
  );
}
