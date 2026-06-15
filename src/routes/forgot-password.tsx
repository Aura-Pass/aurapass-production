import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Logo } from "@/components/layout/Logo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — AuraPass" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-center bg-[#F9FAFB] px-4 py-16">
        <Card className="w-full max-w-md p-8" style={{ borderRadius: 12 }}>
          <div className="flex justify-center">
            <Logo className="text-2xl" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold text-[#111827]">Reset your password</h1>
          <p className="mt-1 text-center text-sm text-[#6B7280]">
            Enter your email and we'll send you a reset link.
          </p>

          {submitted ? (
            <p className="mt-6 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-center text-sm text-[#111827]">
              If an account exists with that email, a reset link has been sent.
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" variant="primary" size="lg" className="w-full" loading={submitting}>
                Send reset link
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-[#6B7280]">
            <Link to="/login" className="font-semibold text-[#D946EF] hover:underline">
              Back to log in
            </Link>
          </p>
        </Card>
      </div>
    </PageWrapper>
  );
}
