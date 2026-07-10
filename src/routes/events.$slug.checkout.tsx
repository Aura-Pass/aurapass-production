import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { initializePayment } from "@/lib/payments.functions";

const search = z.object({
  ticketTypeId: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/events/$slug/checkout")({
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Checkout — AuraPass" }] }),
  errorComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Something went wrong</h1>
      </div>
    </PageWrapper>
  ),
  notFoundComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[#111827]">Checkout unavailable</h1>
      </div>
    </PageWrapper>
  ),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { slug } = Route.useParams();
  const { ticketTypeId } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const initPay = useServerFn(initializePayment);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any | null>(null);
  const [ticket, setTicket] = useState<any | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setFetchError(null);
      if (!ticketTypeId) {
        setFetchError("Missing ticketTypeId in URL. Please pick a ticket on the event page.");
        setLoading(false);
        return;
      }
      const { data, error } = await (supabase as any)
        .from("events")
        .select("id, slug, title, event_date, event_time, venue, city, status, ticket_types(*)")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("[checkout] events query failed", error);
        setFetchError(`Could not load event: ${error.message} (code ${error.code ?? "n/a"})`);
        setLoading(false);
        return;
      }
      if (!data) {
        setFetchError(
          "Event not found or not visible. It may be unpublished or RLS is blocking public read access.",
        );
        setLoading(false);
        return;
      }
      const t = data?.ticket_types?.find((x: any) => x.id === ticketTypeId) ?? null;
      if (!t) {
        setFetchError(
          "Ticket type not found for this event. It may have been removed, or RLS is hiding ticket_types from anonymous visitors.",
        );
      }
      setEvent(data);
      setTicket(t);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug, ticketTypeId]);


  useEffect(() => {
    if (profile) {
      setFullName((n) => n || profile.full_name || "");
      setEmail((e) => e || profile.email || "");
      setPhone((p) => p || profile.phone || "");
    }
  }, [profile]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!event || !ticket) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-[#111827]">Ticket not available</h1>
          {fetchError && (
            <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {fetchError}
            </p>
          )}
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/events/$slug" params={{ slug }}>Back to event</Link>
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }


  const remaining = Math.max(0, Number(ticket.quantity) - Number(ticket.quantity_sold));
  const maxQty = Math.min(remaining, 10);
  const price = Number(ticket.price);
  const subtotal = price * quantity;
  const isFree = subtotal === 0;
  const platformFee = isFree ? 0 : Math.round(subtotal * 0.035 + 100);
  const total = subtotal + platformFee;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!phone.trim()) return setError("Please enter your phone number.");
    if (quantity < 1 || quantity > maxQty) return setError("Invalid quantity.");

    setSubmitting(true);
    try {
      const result = await initPay({
        data: {
          eventId: event.id,
          ticketTypeId,
          quantity,
          buyerName: fullName.trim(),
          buyerEmail: email.trim(),
          buyerPhone: phone.trim(),
          userId: user?.id ?? null,
          callbackUrl: `${window.location.origin}/payment-callback`,
        },
      });

      if ("error" in result && result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      if ("free" in result && result.free) {
        toast.success("Your free ticket is reserved!");
        navigate({ to: "/order-confirmation/$orderId", params: { orderId: result.orderId } });
        return;
      }
      if ("authorizationUrl" in result && result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }
      setError("Unexpected response.");
      setSubmitting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setSubmitting(false);
    }
  }

  return (
    <PageWrapper>
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="text-2xl font-bold text-[#111827] md:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-[#6B7280]">{event.title}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-4">
              <h2 className="font-semibold text-[#111827]">Ticket</h2>
              <div className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-4">
                <div>
                  <p className="font-semibold text-[#111827]">{ticket.name}</p>
                  <p className="text-sm text-[#6B7280]">
                    {isFree && quantity === 1 ? "Free" : formatCurrency(price)} · {remaining} left
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    disabled={quantity >= maxQty}
                  >
                    +
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="font-semibold text-[#111827]">Your details</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </Card>
          </form>

          <aside className="space-y-4">
            <Card className="p-6">
              <h2 className="font-semibold text-[#111827]">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">
                    {ticket.name} × {quantity}
                  </span>
                  <span className="text-[#111827]">
                    {isFree ? "Free" : formatCurrency(subtotal)}
                  </span>
                </div>
                {!isFree && (
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Platform fee (3.5% + ₦100)</span>
                    <span className="text-[#111827]">{formatCurrency(platformFee)}</span>
                  </div>
                )}
                <div className="my-2 h-px bg-[#E5E7EB]" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-[#111827]">Total</span>
                  <span className="text-[#111827]">
                    {isFree ? "Free" : formatCurrency(total)}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-6 w-full"
                disabled={submitting || remaining < 1}
                onClick={handleSubmit}
              >
                {submitting ? <Spinner className="h-4 w-4" /> : isFree ? "Get Free Ticket" : "Complete Purchase"}
              </Button>
              {remaining < 1 && (
                <p className="mt-2 text-center text-xs text-[#6B7280]">Sold out</p>
              )}
            </Card>
          </aside>
        </div>
      </div>
    </PageWrapper>
  );
}
