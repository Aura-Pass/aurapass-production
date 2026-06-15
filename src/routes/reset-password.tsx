import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Logo } from "@/components/layout/Logo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — AuraPass" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/login" }), 2000);
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-center bg-[#F9FAFB] px-4 py-16">
        <Card className="w-full max-w-md p-8" style={{ borderRadius: 12 }}>
          <div className="flex justify-center">
            <Logo className="text-2xl" />
          </div>
          <h1 className="mt-6 text-center text-2xl font-bold text-[#111827]">
            Set new password
          </h1>
          <p className="mt-1 text-center text-sm text-[#6B7280]">
            Choose a strong password for your account.
          </p>

          {success ? (
            <p className="mt-6 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-center text-sm text-[#111827]">
              Password updated! Redirecting you to log in...
            </p>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {error ? (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                loading={submitting}
              >
                Update password
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
