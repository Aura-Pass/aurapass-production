import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { verifyEquipmentBookingBalance } from "@/lib/equipmentBookingPayments.functions";

const search = z.object({
  reference: fallback(z.string(), "").default(""),
  trxref: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/equipment-balance-callback")({
  validateSearch: zodValidator(search),
  head: () => ({ meta: [{ title: "Confirming balance — AuraPass" }] }),
  component: EquipmentBalanceCallbackPage,
});

function EquipmentBalanceCallbackPage() {
  const { reference, trxref } = Route.useSearch();
  const ref = reference || trxref;
  const navigate = useNavigate();
  const verify = useServerFn(verifyEquipmentBookingBalance);
  const [status, setStatus] = useState<"verifying" | "failed">("verifying");

  useEffect(() => {
    if (!ref) {
      setStatus("failed");
      return;
    }
    let active = true;
    (async () => {
      try {
        const result = await verify({ data: { reference: ref } });
        if (!active) return;
        if (result.success) {
          navigate({ to: "/dashboard/equipment/bookings" });
        } else {
          setStatus("failed");
        }
      } catch {
        if (active) setStatus("failed");
      }
    })();
    return () => {
      active = false;
    };
  }, [ref, navigate, verify]);

  return (
    <PageWrapper>
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        {status === "verifying" ? (
          <>
            <Spinner className="h-10 w-10" />
            <h1 className="mt-6 text-xl font-semibold text-foreground">
              Confirming your balance payment…
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-foreground">
              Balance payment could not be confirmed
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Please try again. If you were charged, contact support.
            </p>
            <div className="mt-6 flex gap-2">
              <Button asChild variant="primary">
                <Link to="/dashboard/equipment/bookings">Back to bookings</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/">Back to home</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </PageWrapper>
  );
}
