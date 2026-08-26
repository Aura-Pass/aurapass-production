/**
 * Equipment lister listings management — create, edit, pause and delete listings.
 */
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Speaker } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EquipmentListingForm } from "@/components/equipment/EquipmentListingForm";
import { useMyEquipmentListings } from "@/hooks/useEquipmentListings";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/bookings";

export const Route = createFileRoute("/dashboard/equipment/")({
  head: () => ({
    meta: [
      { title: "My Equipment Listings | AuraPass" },
      {
        name: "description",
        content: "Create, edit and manage the event equipment you rent out on AuraPass.",
      },
      { property: "og:title", content: "My Equipment Listings | AuraPass" },
      {
        property: "og:description",
        content: "Manage the event equipment you rent out on AuraPass.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["equipment_lister", "admin"]}>
      <MyEquipmentListingsPage />
    </ProtectedRoute>
  ),
});

function MyEquipmentListingsPage() {
  const { listings, loading, refetch } = useMyEquipmentListings();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function toggleActive(id: string, next: boolean) {
    const { error } = await (supabase as any)
      .from("equipment_listings")
      .update({ is_active: next })
      .eq("id", id);
    if (error) {
      toast.error(error.message ?? "Could not update this listing.");
      return;
    }
    toast.success(next ? "Listing is live." : "Listing paused.");
    await refetch();
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this listing? This cannot be undone.")) return;
    const { error } = await (supabase as any).from("equipment_listings").delete().eq("id", id);
    if (error) {
      toast.error(error.message ?? "Could not delete this listing.");
      return;
    }
    toast.success("Listing deleted.");
    await refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">My Listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the equipment you rent out to event organisers.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingId(null);
            setCreating((v) => !v);
          }}
        >
          <Plus className="mr-1 h-4 w-4" />
          {creating ? "Cancel" : "New Listing"}
        </Button>
      </div>

      {creating ? (
        <Card className="p-6" style={{ borderRadius: 12 }}>
          <EquipmentListingForm
            mode="create"
            onSaved={async () => {
              setCreating(false);
              await refetch();
            }}
          />
        </Card>
      ) : null}

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      ) : listings.length === 0 ? (
        <Card className="p-10 text-center" style={{ borderRadius: 12 }}>
          <Speaker className="mx-auto h-8 w-8 text-muted-foreground-light" />
          <p className="mt-3 text-muted-foreground">You haven't listed any equipment yet.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {listings.map((l) => (
            <Card key={l.id} className="p-5" style={{ borderRadius: 12 }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground">{l.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{formatNaira(l.rental_price)}</p>
                </div>
                <Badge
                  className={
                    l.is_active
                      ? "bg-success-light text-success-strong hover:bg-success-light"
                      : "bg-accent text-muted-foreground hover:bg-accent"
                  }
                >
                  {l.is_active ? "Active" : "Paused"}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCreating(false);
                    setEditingId((cur) => (cur === l.id ? null : l.id));
                  }}
                >
                  {editingId === l.id ? "Close" : "Edit"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void toggleActive(l.id, !l.is_active)}
                >
                  {l.is_active ? "Pause" : "Activate"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void remove(l.id)}
                >
                  Delete
                </Button>
              </div>

              {editingId === l.id ? (
                <div className="mt-5 border-t border-border pt-5">
                  <EquipmentListingForm
                    mode="edit"
                    existing={l}
                    onSaved={async () => {
                      setEditingId(null);
                      await refetch();
                    }}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
