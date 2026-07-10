import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { PageWrapper } from "@/components/layout/PageWrapper";
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
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/organiser/create-event")({
  head: () => ({ meta: [{ title: "Create Event — AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser"]}>
      <CreateEventPage />
    </ProtectedRoute>
  ),
});

type TicketRow = { name: string; price: string; quantity: string };

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

const EMPTY_TICKET: TicketRow = { name: "", price: "0", quantity: "1" };

function CreateEventPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [tickets, setTickets] = useState<TicketRow[]>([{ ...EMPTY_TICKET }]);

  function set<K extends keyof EventForm>(key: K, value: EventForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validateStep1(): string | null {
    if (!form.title.trim()) return "Please enter an event title.";
    if (form.description.trim().length < 50)
      return "Description must be at least 50 characters.";
    if (!form.category) return "Please choose a category.";
    if (!form.city) return "Please choose a city.";
    if (!form.venue.trim()) return "Please enter a venue.";
    if (!form.event_date) return "Please select an event date.";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(form.event_date) <= today)
      return "Event date must be in the future.";
    if (!form.event_time) return "Please select an event time.";
    if (!form.banner_url.trim()) return "Please upload an event banner before continuing";
    return null;
  }

  function validateStep2(): string | null {
    if (tickets.length === 0) return "Add at least one ticket type.";
    for (const [i, t] of tickets.entries()) {
      if (!t.name.trim()) return `Ticket #${i + 1}: please enter a name.`;
      const price = Number(t.price);
      const qty = Number(t.quantity);
      if (Number.isNaN(price) || price < 0)
        return `Ticket #${i + 1}: price must be 0 or greater.`;
      if (!Number.isInteger(qty) || qty < 1)
        return `Ticket #${i + 1}: quantity must be at least 1.`;
    }
    return null;
  }

  function goNext() {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  }

  function goBack() {
    setError(null);
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) { setError("You must be signed in."); return; }
    const err1 = validateStep1(); if (err1) { setError(err1); setStep(1); return; }
    const err2 = validateStep2(); if (err2) { setError(err2); setStep(2); return; }

    setSubmitting(true);
    try {
      const { data: eventRow, error: eventErr } = await (supabase as any)
        .from("events")
        .insert({
          organiser_id: user.id,
          title: form.title.trim(),
          description: form.description.trim(),
          banner_url: form.banner_url.trim() || null,
          category: form.category,
          venue: form.venue.trim(),
          city: form.city,
          event_date: form.event_date,
          event_time: form.event_time,
          status: "pending_review",
        })
        .select("id")
        .single();

      if (eventErr || !eventRow) {
        throw new Error(eventErr?.message ?? "Failed to create event.");
      }

      const ticketRows = tickets.map((t) => ({
        event_id: eventRow.id,
        name: t.name.trim(),
        price: Number(t.price),
        quantity: Number(t.quantity),
      }));

      const { error: ticketErr } = await (supabase as any)
        .from("ticket_types")
        .insert(ticketRows);

      if (ticketErr) {
        throw new Error(ticketErr.message);
      }

      // Fire admin notification — never block submission on email failure.
      try {
        await sendAdminEventSubmissionEmailFn({
          data: {
            eventTitle: form.title.trim(),
            organiserName: profile?.full_name ?? "Unknown organiser",
            organiserEmail: profile?.email ?? user.email ?? "unknown@aurapassticket.com",
            eventDate: form.event_date,
            eventCity: form.city,
            eventId: String(eventRow.id),
          },
        });
      } catch (emailErr) {
        console.error("[create-event] admin email failed", emailErr);
      }

      toast.success("Event submitted! We'll review it shortly.");
      navigate({ to: "/dashboard/organiser" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <div className="bg-[#F9FAFB]">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
          <div className="mb-6 flex items-center justify-between">
            <Link to="/dashboard/organiser" className="text-sm text-[#6B7280] hover:text-[#111827]">
              ← Back to dashboard
            </Link>
          </div>

          <StepIndicator step={step} />

          <Card className="mt-6 p-6 md:p-8" style={{ borderRadius: 12 }}>
            <form onSubmit={handleSubmit} noValidate>
              {step === 1 && (
                <Step1
                  form={form}
                  set={set}
                />
              )}
              {step === 2 && (
                <Step2
                  tickets={tickets}
                  setTickets={setTickets}
                />
              )}
              {step === 3 && (
                <Step3 form={form} tickets={tickets} />
              )}

              {error ? (
                <p className="mt-4 rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={step === 1 || submitting}
                >
                  Back
                </Button>
                {step < 3 ? (
                  <Button type="button" variant="primary" onClick={goNext}>
                    Continue
                  </Button>
                ) : (
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" /> Submitting…
                      </span>
                    ) : (
                      "Submit for Review"
                    )}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Event details" },
    { n: 2, label: "Ticket types" },
    { n: 3, label: "Review" },
  ];
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => {
        const active = s.n === step;
        const done = s.n < step;
        return (
          <div key={s.n} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                  active && "bg-[#D946EF] text-white",
                  done && "bg-[#A21CAF] text-white",
                  !active && !done && "bg-[#E5E7EB] text-[#6B7280]",
                )}
              >
                {s.n}
              </div>
              <span
                className={cn(
                  "hidden text-sm font-medium md:inline",
                  active ? "text-[#111827]" : "text-[#6B7280]",
                )}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <div className="h-px w-8 bg-[#E5E7EB] md:w-12" />
            ) : null}
          </div>
        );
      })}
      <span className="ml-auto text-xs font-medium uppercase tracking-wide text-[#6B7280]">
        Step {step} of 3
      </span>
    </div>
  );
}

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-2xl font-bold text-[#111827]"
      style={{ fontFamily: "'Playfair Display', serif" }}
    >
      {children}
    </h2>
  );
}

function Step1({
  form,
  set,
}: {
  form: EventForm;
  set: <K extends keyof EventForm>(k: K, v: EventForm[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <StepHeading>Tell us about your event</StepHeading>

      <Input
        label="Event title"
        placeholder="e.g. Detty December Kickoff Party"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
      />

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#111827]">
          Description
        </label>
        <Textarea
          rows={5}
          placeholder="Tell attendees what to expect (minimum 50 characters)"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
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
          onChange={(v) => set("category", v)}
          options={EVENT_CATEGORIES.map((c) => ({ value: c.label, label: `${c.icon} ${c.label}` }))}
          placeholder="Choose a category"
        />
        <NativeSelect
          label="City"
          value={form.city}
          onChange={(v) => set("city", v)}
          options={CITIES.map((c) => ({ value: c, label: c }))}
          placeholder="Choose a city"
        />
      </div>

      <Input
        label="Venue"
        placeholder="e.g. Landmark Beach"
        value={form.venue}
        onChange={(e) => set("venue", e.target.value)}
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Input
          type="date"
          label="Event date"
          value={form.event_date}
          onChange={(e) => set("event_date", e.target.value)}
        />
        <Input
          type="time"
          label="Event time"
          value={form.event_time}
          onChange={(e) => set("event_time", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#111827]">Event banner</label>
        <ImageUpload
          value={form.banner_url}
          onChange={(url) => set("banner_url", url)}
        />
      </div>
    </div>
  );
}

function Step2({
  tickets,
  setTickets,
}: {
  tickets: TicketRow[];
  setTickets: React.Dispatch<React.SetStateAction<TicketRow[]>>;
}) {
  function update(i: number, patch: Partial<TicketRow>) {
    setTickets((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    setTickets((rows) => rows.filter((_, idx) => idx !== i));
  }
  function add() {
    setTickets((rows) => [...rows, { ...EMPTY_TICKET }]);
  }

  return (
    <div className="space-y-5">
      <StepHeading>Set up your ticket types</StepHeading>
      <p className="text-sm text-[#6B7280]">
        Add at least one ticket type. Use ₦0 for free tickets.
      </p>

      <div className="space-y-4">
        {tickets.map((t, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4"
            style={{ borderRadius: 12 }}
          >
            <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
              <Input
                label="Name"
                placeholder="e.g. General"
                value={t.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <Input
                label="Price (₦)"
                type="number"
                min="0"
                step="500"
                value={t.price}
                onChange={(e) => update(i, { price: e.target.value })}
              />
              <Input
                label="Quantity"
                type="number"
                min="1"
                step="1"
                value={t.quantity}
                onChange={(e) => update(i, { quantity: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => remove(i)}
                disabled={tickets.length === 1}
                className="md:mb-0"
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="button" variant="secondary" onClick={add}>
        + Add another ticket type
      </Button>
    </div>
  );
}

function Step3({ form, tickets }: { form: EventForm; tickets: TicketRow[] }) {
  return (
    <div className="space-y-5">
      <StepHeading>Review & submit</StepHeading>

      <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-5" style={{ borderRadius: 12 }}>
        <h3 className="text-base font-semibold text-[#111827]">{form.title}</h3>
        <p className="mt-1 text-sm text-[#6B7280]">{form.description}</p>

        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Category" value={form.category} />
          <Row label="City" value={form.city} />
          <Row label="Venue" value={form.venue} />
          <Row label="Date" value={form.event_date} />
          <Row label="Time" value={form.event_time} />
          <Row label="Banner URL" value={form.banner_url || "—"} />
        </dl>
      </div>

      <div className="rounded-xl border border-[#E5E7EB] bg-white p-5" style={{ borderRadius: 12 }}>
        <h4 className="text-sm font-semibold text-[#111827]">Tickets</h4>
        <ul className="mt-3 divide-y divide-[#F3F4F6]">
          {tickets.map((t, i) => (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="font-medium text-[#111827]">{t.name || `Ticket ${i + 1}`}</span>
              <span className="text-[#6B7280]">
                ₦{Number(t.price).toLocaleString()} · {t.quantity} available
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
        Your event will be reviewed by our team before it appears publicly. This usually takes a few hours.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[#6B7280]">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-[#111827]">{value || "—"}</dd>
    </div>
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
