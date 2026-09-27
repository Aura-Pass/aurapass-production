import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { initializePayment } from "@/lib/payments.functions";

export const Route = createFileRoute("/events/$slug/merch")({
  head: () => ({
    meta: [
      { title: "Buy Event Merch — AuraPass" },
      { name: "description", content: "Buy official event merch on AuraPass and collect it at the event." },
      { property: "og:title", content: "Buy Event Merch — AuraPass" },
      { property: "og:description", content: "Buy official event merch on AuraPass and collect it at the event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      </div>
    </PageWrapper>
  ),
  notFoundComponent: () => (
    <PageWrapper>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Merch unavailable</h1>
      </div>
    </PageWrapper>
  ),
  component: MerchPage,
});

function MerchPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const initPay = useServerFn(initializePayment);

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: ev } = await (supabase as any)
        .from("events")
        .select("id, slug, title, status")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      if (!ev) {
        setLoading(false);
        return;
      }
      const { data: merch } = await (supabase as any).rpc("get_event_merch_items", {
        p_event_id: ev.id,
        p_include_inactive: false,
      });
      if (!active) return;
      setEvent(ev);
      setItems(((merch as any[]) ?? []).filter((m) => m.is_active !== false));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

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

  if (!event || items.length === 0) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">No merch available</h1>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/events/$slug" params={{ slug }}>Back to event</Link>
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const selected = items.filter((m) => (qty[m.id] || 0) > 0);
  const subtotal = selected.reduce((s, m) => s + Number(m.price) * qty[m.id], 0);
  const isFree = subtotal === 0;
  const platformFee = isFree ? 0 : Math.round(subtotal * 0.035 + 100);
  const total = subtotal + platformFee;

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (selected.length === 0) return setError("Select at least one item.");
    if (!fullName.trim()) return setError("Please enter your full name.");
    if (!email.trim()) return setError("Please enter your email.");
    if (!phone.trim()) return setError("Please enter your phone number.");

    setSubmitting(true);
    try {
      const result = await initPay({
        data: {
          eventId: event.id,
          ticketTypeId: null,
          quantity: 0,
          buyerName: fullName.trim(),
          buyerEmail: email.trim(),
          buyerPhone: phone.trim(),
          userId: user?.id ?? null,
          merchItems: selected.map((m) => ({ merchItemId: m.id, quantity: qty[m.id] })),
          callbackUrl: `${window.location.origin}/payment-callback`,
        },
      });
      if ("error" in result && result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      if ("free" in result && result.free) {
        toast.success("Your merch is reserved!");
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
        <Link to="/events/$slug" params={{ slug }} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to event
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">Buy Merch</h1>
        <p className="mt-1 text-sm text-muted-foreground">{event.title}</p>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((m) => {
                const q = qty[m.id] || 0;
                const remaining =
                  m.quantity_available == null
                    ? Infinity
                    : Math.max(0, Number(m.quantity_available) - Number(m.quantity_sold));
                const soldOut = remaining <= 0;
                const cap = Math.min(remaining, 10);
                return (
                  <Card key={m.id} className={`flex flex-col p-4 ${soldOut ? "opacity-60" : ""}`}>
                    {m.image_url ? (
                      <button
                        type="button"
                        onClick={() => setPreview({ url: m.image_url, name: m.name })}
                        className="overflow-hidden rounded-md"
                        aria-label={`View ${m.name} image`}
                      >
                        <img src={m.image_url} alt={m.name} className="h-48 w-full object-cover" />
                      </button>
                    ) : (
                      <div className="flex h-48 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                    <p className="mt-3 font-semibold text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(Number(m.price))}</p>
                    {soldOut ? (
                      <span className="text-xs font-medium text-destructive">Sold out</span>
                    ) : remaining !== Infinity ? (
                      <span className="text-xs text-muted-foreground">{remaining} left</span>
                    ) : null}
                    <div className="mt-auto flex items-center justify-center gap-2 pt-4">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setQty((s) => ({ ...s, [m.id]: Math.max(0, q - 1) }))}
                        disabled={q <= 0 || soldOut}
                      >
                        −
                      </Button>
                      <span className="w-8 text-center font-medium">{q}</span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setQty((s) => ({ ...s, [m.id]: Math.min(cap, q + 1) }))}
                        disabled={soldOut || q >= cap}
                      >
                        +
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Your details</h2>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </Card>
          </form>

          <aside>
            <Card className="p-6">
              <h2 className="font-semibold text-foreground">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                {selected.length === 0 && <p className="text-muted-foreground">No items selected</p>}
                {selected.map((m) => (
                  <div key={m.id} className="flex justify-between">
                    <span className="text-muted-foreground">{m.name} × {qty[m.id]}</span>
                    <span className="text-foreground">{formatCurrency(Number(m.price) * qty[m.id])}</span>
                  </div>
                ))}
                {!isFree && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee (3.5% + ₦100)</span>
                    <span className="text-foreground">{formatCurrency(platformFee)}</span>
                  </div>
                )}
                <div className="my-2 h-px bg-border" />
                <div className="flex justify-between text-base font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatCurrency(total)}</span>
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="mt-6 w-full"
                disabled={submitting || selected.length === 0}
                onClick={() => handleSubmit()}
              >
                {submitting ? <Spinner className="h-4 w-4" /> : "Buy Merch"}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                You'll get a QR code to collect your merch at the event.
              </p>
            </Card>
          </aside>
        </div>
      </div>

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl p-0">
          <DialogTitle className="sr-only">{preview?.name ?? "Merch preview"}</DialogTitle>
          {preview && <img src={preview.url} alt={preview.name} className="h-auto w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
