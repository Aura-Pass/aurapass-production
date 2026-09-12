/**
 * Per-event merch management for organisers.
 *
 * List, add, edit and delete merchandise items for an event via the
 * get_event_merch_items / upsert_event_merch_item / delete_event_merch_item
 * RPCs. Guarded directly by ProtectedRoute and scoped to the event owner or
 * admins.
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Package, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/merch/$eventId")({
  head: () => ({
    meta: [
      { title: "Event Merch | AuraPass" },
      {
        name: "description",
        content: "Manage merchandise for your AuraPass event.",
      },
      { property: "og:title", content: "Event Merch | AuraPass" },
      {
        property: "og:description",
        content: "Manage merchandise for your AuraPass event.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <MerchPage />
    </ProtectedRoute>
  ),
});

interface MerchItem {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  quantity_available: number | null;
  quantity_sold: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  price: "",
  quantityAvailable: "",
  imageUrl: "",
  isActive: true,
};

function MerchPage() {
  const { eventId } = Route.useParams();
  const { user, activeRoles } = useAuth();

  const [eventTitle, setEventTitle] = useState("");
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [checkingOwnership, setCheckingOwnership] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  const [items, setItems] = useState<MerchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = activeRoles.includes("admin");

  const loadItems = useCallback(async () => {
    const { data, error } = await (supabase as any).rpc("get_event_merch_items", {
      p_event_id: eventId,
      p_include_inactive: true,
    });

    if (error) {
      toast.error(error.message || "Could not load merch items");
      setItems([]);
    } else {
      setItems(
        ((data as any[]) ?? []).map((r) => ({
          id: r.id,
          event_id: r.event_id,
          name: r.name ?? "",
          description: r.description ?? null,
          price: Number(r.price ?? 0),
          image_url: r.image_url ?? null,
          is_active: Boolean(r.is_active ?? true),
          quantity_available:
            r.quantity_available == null ? null : Number(r.quantity_available),
          quantity_sold: Number(r.quantity_sold ?? 0),
        })),
      );
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("title, organiser_id")
        .eq("id", eventId)
        .single();

      if (!active) return;

      if (error || !data) {
        setCheckingOwnership(false);
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      setEventTitle((data.title as string) ?? "");
      setOwnerId((data.organiser_id as string) ?? null);

      const currentUserId = user?.id;
      if (!currentUserId) {
        setUnauthorized(true);
        setCheckingOwnership(false);
        setLoading(false);
        return;
      }

      if (currentUserId !== data.organiser_id && !isAdmin) {
        setUnauthorized(true);
        setCheckingOwnership(false);
        setLoading(false);
        return;
      }

      setCheckingOwnership(false);
      await loadItems();
    })();

    return () => {
      active = false;
    };
  }, [eventId, user?.id, isAdmin, loadItems]);

  function openAdd() {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(item: MerchItem) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      quantityAvailable:
        item.quantity_available == null ? "" : String(item.quantity_available),
      imageUrl: item.image_url ?? "",
      isActive: item.is_active,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setImageError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast.error("Item name is required");
      return;
    }

    const price = Number(form.price);
    if (Number.isNaN(price) || price < 0) {
      toast.error("Price must be a number greater than or equal to 0");
      return;
    }

    let quantity: number | null = null;
    if (form.quantityAvailable.trim() !== "") {
      quantity = Number(form.quantityAvailable);
      if (!Number.isInteger(quantity) || quantity < 0) {
        toast.error("Quantity available must be a whole number of 0 or more");
        return;
      }
    }

    setSaving(true);

    const { error } = await (supabase as any).rpc("upsert_event_merch_item", {
      p_id: editingItem?.id ?? null,
      p_event_id: eventId,
      p_name: name,
      p_description: form.description.trim() || null,
      p_price: price,
      p_image_url: form.imageUrl.trim() || null,
      p_is_active: form.isActive,
      p_quantity_available: quantity,
    });

    setSaving(false);

    if (error) {
      toast.error(error.message || "Could not save merch item");
      return;
    }

    toast.success(editingItem ? "Merch item updated" : "Merch item added");
    closeForm();
    loadItems();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const { error } = await (supabase as any).rpc("delete_event_merch_item", {
      p_id: id,
    });
    setDeletingId(null);

    if (error) {
      toast.error(error.message || "Could not delete merch item");
      return;
    }

    toast.success("Merch item deleted");
    loadItems();
  }

  if (checkingOwnership) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <Card className="p-8 text-center" style={{ borderRadius: 12 }}>
        <p className="text-foreground">You do not have access to this event's merch.</p>
        <Button asChild variant="primary" className="mt-4">
          <Link to="/dashboard/organiser/events" search={{ filter: "all" }}>
            Back to my events
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Merch</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {eventTitle
              ? `Manage merchandise for “${eventTitle}”.`
              : "Manage merchandise for this event."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={openAdd}>
            + Add item
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/organiser/events" search={{ filter: "all" }}>
              Back to events
            </Link>
          </Button>
        </div>
      </div>

      <Card className="p-5" style={{ borderRadius: 12 }}>
        <h2 className="text-sm font-semibold text-foreground">Merch items</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-10 text-center">
            <Package className="mx-auto h-8 w-8 text-border-strong" />
            <p className="mt-2 text-sm text-muted-foreground">
              No merch yet for this event.
            </p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openAdd}>
              Add your first item
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-md border border-border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-accent">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-muted-foreground-light" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    {item.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </div>
                  {item.description ? (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="text-sm font-medium text-foreground">
                    {formatCurrency(item.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity_available == null
                      ? "Unlimited stock"
                      : `${item.quantity_sold} / ${item.quantity_available} sold`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(item)}
                    aria-label="Edit merch item"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={deletingId === item.id}
                        aria-label="Delete merch item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete “{item.name}”?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the merch item from the event. Existing orders are
                          not affected.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(item.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit merch item" : "Add merch item"}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the details for this merch item."
                : "Add a new item attendees can buy with their tickets."}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 px-6">
            <form id="merch-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="merch-name">Name</Label>
                <Input
                  id="merch-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. AuraPass tee"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="merch-description">Description</Label>
                <Textarea
                  id="merch-description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Optional short description"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="merch-price">Price (₦)</Label>
                  <Input
                    id="merch-price"
                    type="number"
                    min={0}
                    step="any"
                    value={form.price}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="merch-quantity">Quantity available</Label>
                  <Input
                    id="merch-quantity"
                    type="number"
                    min={0}
                    step={1}
                    value={form.quantityAvailable}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, quantityAvailable: e.target.value }))
                    }
                    placeholder="Leave blank for unlimited"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Image</Label>
                <ImageUpload
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive items are hidden from buyers.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((f) => ({ ...f, isActive: checked }))
                  }
                />
              </div>
            </form>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="merch-form"
              variant="primary"
              loading={saving}
            >
              {editingItem ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
