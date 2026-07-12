import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ImageUpload } from "@/components/ui/ImageUpload";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { sendAdminEventSubmissionEmailFn } from "@/lib/email.functions";
import { EVENT_CATEGORIES, CITIES } from "@/constants";

export const Route = createFileRoute("/dashboard/organiser/edit-event/$eventId")({
  head: () => ({ meta: [{ title: "Edit Event — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <EditEventPage />
    </ProtectedRoute>
  ),
});

interface EventForm {
  title: string;
  description: string;
  category: string;
  city: string;
  venue: string;
  event_date: string;
  event_time: string;
  banner_url: string;
}

type TicketRow = {
  id?: string;
  name: string;
  price: string;
  quantity: string;
  quantity_sold: number;
  isNew?: boolean;
};

function EditEventPage() {
  const { eventId } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [form, setForm] = useState<EventForm>({
    title: "",
    description: "",
    category: "",
    city: "",
    venue: "",
    event_date: "",
    event_time: "",
    banner_url: "",
  });
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [originalStatus, setOriginalStatus] = useState<string>("");
  const [originalReviewFields, setOriginalReviewFields] = useState<{
    title: string;
    description: string;
    banner_url: string;
  }>({ title: "", description: "", banner_url: "" });

  function setField<K extends keyof EventForm>(k: K, v: EventForm[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data: evt, error: evtErr } = await (supabase as any)
        .from("events")
        .select("*, ticket_types(*)")
        .eq("id", eventId)
        .maybeSingle();
      if (!active) return;
      if (evtErr || !evt) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (evt.organiser_id !== user.id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setForm({
        title: evt.title ?? "",
        description: evt.description ?? "",
        category: evt.category ?? "",
        city: evt.city ?? "",
        venue: evt.venue ?? "",
        event_date: evt.event_date ?? "",
        event_time: (evt.event_time ?? "").slice(0, 5),
        banner_url: evt.banner_url ?? "",
      });
      setOriginalStatus(evt.status ?? "");
      setOriginalReviewFields({
        title: evt.title ?? "",
        description: evt.description ?? "",
        banner_url: evt.banner_url ?? "",
      });
      setTickets(
        (evt.ticket_types ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          price: String(t.price),
          quantity: String(t.quantity),
          quantity_sold: Number(t.quantity_sold ?? 0),
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [eventId, user]);

  function validate(): string | null {
    if (!form.title.trim()) return "Please enter an event title.";
    if (form.description.trim().length < 50) return "Description must be at least 50 characters.";
    if (!form.category) return "Please choose a category.";
    if (!form.city) return "Please choose a city.";
    if (!form.venue.trim()) return "Please enter a venue.";
    if (!form.event_date) return "Please select an event date.";
    if (!form.event_time) return "Please select an event time.";
    if (!form.banner_url.trim()) return "Please upload an event banner before continuing";
    if (tickets.length === 0) return "Add at least one ticket type.";
    for (const [i, t] of tickets.entries()) {
      if (!t.name.trim()) return `Ticket #${i + 1}: please enter a name.`;
      const price = Number(t.price);
      const qty = Number(t.quantity);
      if (Number.isNaN(price) || price < 0) return `Ticket #${i + 1}: price must be 0 or greater.`;
      if (!Number.isInteger(qty) || qty < 1) return `Ticket #${i + 1}: quantity must be at least 1.`;
      if (qty < t.quantity_sold) {
        return `Cannot reduce quantity below ${t.quantity_sold} — that many tickets have already been sold.`;
      }
    }
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!user) return setError("You must be signed in.");
    const err = validate();
    if (err) return setError(err);

    setSubmitting(true);
    try {
      const newTitle = form.title.trim();
      const newDescription = form.description.trim();
      const newBanner = form.banner_url.trim() || null;
      const originalBanner = originalReviewFields.banner_url || null;
      const reviewFieldChanged =
        newTitle !== originalReviewFields.title ||
        newDescription !== originalReviewFields.description ||
        newBanner !== originalBanner;
      const shouldResetToReview = originalStatus === "published" && reviewFieldChanged;
      const isResubmission = originalStatus === "rejected";

      const updatePayload: Record<string, unknown> = {
        title: newTitle,
        description: newDescription,
        category: form.category,
        city: form.city,
        venue: form.venue.trim(),
        event_date: form.event_date,
        event_time: form.event_time,
        banner_url: newBanner,
      };
      if (shouldResetToReview) updatePayload.status = "pending_review";
      if (isResubmission) {
        updatePayload.status = "pending_review";
        updatePayload.rejection_reason = null;
      }

      const { error: updErr } = await (supabase as any)
        .from("events")
        .update(updatePayload)
        .eq("id", eventId)
        .eq("organiser_id", user.id);
      if (updErr) throw new Error(updErr.message);

      // Update existing ticket types and insert new ones
      for (const t of tickets) {
        if (t.id) {
          const { error: tErr } = await (supabase as any)
            .from("ticket_types")
            .update({
              name: t.name.trim(),
              price: Number(t.price),
              quantity: Number(t.quantity),
            })
            .eq("id", t.id);
          if (tErr) throw new Error(tErr.message);
        } else {
          const { error: tErr } = await (supabase as any).from("ticket_types").insert({
            event_id: eventId,
            name: t.name.trim(),
            price: Number(t.price),
            quantity: Number(t.quantity),
          });
          if (tErr) throw new Error(tErr.message);
        }
      }

      if (isResubmission) {
        // Fire admin notification on resubmission — never block save on email failure.
        try {
          await sendAdminEventSubmissionEmailFn({
            data: {
              eventTitle: newTitle,
              organiserName: profile?.full_name ?? "Unknown organiser",
              organiserEmail: profile?.email ?? user.email ?? "unknown@aurapassticket.com",
              eventDate: form.event_date,
              eventCity: form.city,
              eventId: String(eventId),
            },
          });
        } catch (emailErr) {
          console.error("[edit-event] admin resubmission email failed", emailErr);
        }
      }

      toast.success(
        isResubmission
          ? "Your event has been resubmitted for review. We'll notify you once it's approved."
          : shouldResetToReview
            ? "Event updated — sent back for review because key details changed"
            : "Event updated",
      );
      navigate({ to: "/dashboard/organiser" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Event not found</h1>
          <p className="mt-2 text-sm text-[#6B7280]">
            You don't have permission to edit this event, or it no longer exists.
          </p>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/dashboard/organiser">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
          <div className="mb-6">
            <Link to="/dashboard/organiser" className="text-sm text-[#6B7280] hover:text-[#111827]">
              ← Back to dashboard
            </Link>
          </div>

          <Card className="p-6 md:p-8" style={{ borderRadius: 12 }}>
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <h2
                className="text-2xl font-bold text-[#111827]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Edit event
              </h2>

              <div className="space-y-5">
                <Input
                  label="Event title"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#111827]">Description</label>
                  <Textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-[#6B7280]">
                    {form.description.length} / 50 characters minimum
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <NativeSelect
                    label="Category"
                    value={form.category}
                    onChange={(v) => setField("category", v)}
                    options={EVENT_CATEGORIES.map((c) => ({
                      value: c.label,
                      label: `${c.icon} ${c.label}`,
                    }))}
                    placeholder="Choose a category"
                  />
                  <NativeSelect
                    label="City"
                    value={form.city}
                    onChange={(v) => setField("city", v)}
                    options={CITIES.map((c) => ({ value: c, label: c }))}
                    placeholder="Choose a city"
                  />
                </div>

                <Input
                  label="Venue"
                  value={form.venue}
                  onChange={(e) => setField("venue", e.target.value)}
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    type="date"
                    label="Event date"
                    value={form.event_date}
                    onChange={(e) => setField("event_date", e.target.value)}
                  />
                  <Input
                    type="time"
                    label="Event time"
                    value={form.event_time}
                    onChange={(e) => setField("event_time", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#111827]">Event banner</label>
                  <ImageUpload
                    value={form.banner_url}
                    onChange={(url) => setField("banner_url", url)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-base font-semibold text-[#111827]">Ticket types</h3>
                {tickets.map((t, i) => (
                  <div
                    key={t.id ?? `new-${i}`}
                    className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4"
                    style={{ borderRadius: 12 }}
                  >
                    <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
                      <Input
                        label="Name"
                        value={t.name}
                        onChange={(e) =>
                          setTickets((rows) =>
                            rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                          )
                        }
                      />
                      <Input
                        label="Price (₦)"
                        type="number"
                        min="0"
                        step="500"
                        value={t.price}
                        onChange={(e) =>
                          setTickets((rows) =>
                            rows.map((r, idx) => (idx === i ? { ...r, price: e.target.value } : r)),
                          )
                        }
                      />
                      <Input
                        label={`Quantity${t.quantity_sold > 0 ? ` (sold: ${t.quantity_sold})` : ""}`}
                        type="number"
                        min={String(Math.max(1, t.quantity_sold))}
                        step="1"
                        value={t.quantity}
                        onChange={(e) =>
                          setTickets((rows) =>
                            rows.map((r, idx) =>
                              idx === i ? { ...r, quantity: e.target.value } : r,
                            ),
                          )
                        }
                      />
                      {!t.id ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTickets((rows) => rows.filter((_, idx) => idx !== i))}
                        >
                          Remove
                        </Button>
                      ) : (
                        <div className="text-xs text-[#9CA3AF]">Existing</div>
                      )}
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    setTickets((rows) => [
                      ...rows,
                      { name: "", price: "0", quantity: "1", quantity_sold: 0, isNew: true },
                    ])
                  }
                >
                  + Add another ticket type
                </Button>
              </div>

              {error ? (
                <p className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center justify-between">
                <Button asChild type="button" variant="outline" disabled={submitting}>
                  <Link to="/dashboard/organiser">Cancel</Link>
                </Button>
                <Button type="submit" variant="primary" disabled={submitting}>
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" /> Saving…
                    </span>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

function NativeSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="w-full space-y-1.5">
      <label className="block text-sm font-medium text-[#111827]">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-11 w-full rounded-md border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] shadow-sm focus-visible:outline-none focus-visible:border-[#D946EF] focus-visible:ring-2 focus-visible:ring-[#D946EF]/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
