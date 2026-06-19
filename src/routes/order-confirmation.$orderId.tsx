import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/utils";

export const Route = createFileRoute("/order-confirmation/$orderId")({
  head: () => ({ meta: [{ title: "Order confirmed — AuraPass" }] }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { orderId } = Route.useParams();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await (supabase as any)
        .from("orders")
        .select("*, events(title, event_date, venue, city), ticket_types(name)")
        .eq("id", orderId)
        .maybeSingle();
      if (!active) return;
      setOrder(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </PageWrapper>
    );
  }

  if (!order) {
    return (
      <PageWrapper>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-xl font-semibold text-[#111827]">Order not found</h1>
          <div className="mt-6">
            <Button asChild variant="primary">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const isFree = Number(order.total_amount) === 0;

  return (
    <PageWrapper>
      <div className="mx-auto max-w-xl px-4 py-12">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#22C55E]" />
          <h1 className="mt-4 text-2xl font-bold text-[#111827]">You're all set!</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            A confirmation has been sent to {order.buyer_email}.
          </p>

          <div className="mt-8 space-y-3 rounded-xl bg-[#F9FAFB] p-5 text-left text-sm">
            <Row label="Event" value={order.events?.title ?? "—"} />
            <Row label="Ticket" value={order.ticket_types?.name ?? "—"} />
            <Row label="Quantity" value={String(order.quantity)} />
            <Row
              label="Total paid"
              value={isFree ? "Free" : formatCurrency(Number(order.total_amount))}
            />
            <Row label="Name" value={order.buyer_name} />
            <Row label="Email" value={order.buyer_email} />
          </div>

          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="primary">
              <Link to="/dashboard/attendee">View My Tickets</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </PageWrapper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#111827] text-right">{value}</span>
    </div>
  );
}
