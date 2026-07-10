import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
              <div className="relative">
                <Input
                  label="New password"
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
                  className="absolute right-3 bottom-0 flex h-11 items-center text-[#6B7280] hover:text-[#111827]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <Input
                  label="Confirm password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 bottom-0 flex h-11 items-center text-[#6B7280] hover:text-[#111827]"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
