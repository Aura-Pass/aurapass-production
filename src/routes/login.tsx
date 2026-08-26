import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Logo } from "@/components/layout/Logo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log In | AuraPass" }] }),
  validateSearch: (search: Record<string, unknown>): { redirect?: string; ticketTypeId?: string; aref?: string } => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    ticketTypeId: typeof search.ticketTypeId === "string" ? search.ticketTypeId : undefined,
    aref: typeof search.aref === "string" ? search.aref : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo, ticketTypeId, aref } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError || !data.user) {
      setSubmitting(false);
      setError("Invalid email or password");
      return;
    }

    // Roles come from the user_roles table (source of truth), not profiles.role.
    const { data: rolesData } = await (supabase as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
    }).rpc("get_user_roles", { user_id: data.user.id });

    const roles = Array.isArray(rolesData)
      ? (rolesData as unknown[])
          .map((r) => (typeof r === "string" ? r : (r as { role?: string })?.role))
          .filter((r): r is string => typeof r === "string")
      : [];

    setSubmitting(false);

    if (redirectTo) {
      navigate({
        to: redirectTo,
        search: {
          ...(ticketTypeId ? { ticketTypeId } : {}),
          ...(aref ? { aref } : {}),
        } as any,
      });
      return;
    }
    if (roles.includes("admin")) navigate({ to: "/dashboard/admin" });
    else if (roles.includes("organiser")) navigate({ to: "/dashboard/organiser" });
    else navigate({ to: "/" });
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-center bg-muted px-4 py-16">
        <Card className="w-full max-w-md p-8" style={{ borderRadius: 12 }}>
          <div className="flex justify-center">
            <Logo className="text-2xl" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Log in to continue to your account.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 bottom-0 flex h-11 items-center text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error ? (
              <p className="rounded-md border border-destructive-strong bg-destructive-light px-3 py-2 text-sm text-destructive-strong">
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
              Log In
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link
              to="/signup"
              search={{
                ...(redirectTo ? { redirect: redirectTo } : {}),
                ...(ticketTypeId ? { ticketTypeId } : {}),
                ...(aref ? { aref } : {}),
              }}
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}
