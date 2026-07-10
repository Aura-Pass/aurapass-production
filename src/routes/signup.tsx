import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Ticket, Megaphone, Eye, EyeOff } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create Account | AuraPass" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: SignUpPage,
});

type Role = "attendee" | "organiser";

function SignUpPage() {
  const navigate = useNavigate();
  const { redirect: redirectTo } = Route.useSearch();
  const [role, setRole] = useState<Role>("attendee");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError(null);

    if (!fullName.trim()) { setError("Please enter your full name."); return; }

    if (!email.trim()) { setError("Please enter your email address."); return; }

    if (!phone.trim()) { setError("Please enter your phone number."); return; }

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          role,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // Supabase security behaviour: when "Confirm email" is ON and the email
    // already exists, signUp returns a fake user object with an empty
    // `identities` array and NO session — instead of an error. Detect that
    // and surface a clear message rather than showing "Check your email".
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError("An account with this email already exists. Try logging in instead.");
      return;
    }

    // Supabase returns a session if email confirmation is OFF
    // It returns no session but a user if confirmation is ON
    if (data?.user && !data?.session) {
      // Email confirmation is ON — show check email message
      setSuccess(true);
      return;
    }

    if (data?.session) {
      // Email confirmation is OFF — redirect immediately
      if (redirectTo) {
        navigate({ to: redirectTo });
        return;
      }
      if (role === "organiser") {
        navigate({ to: "/dashboard/organiser" });
      } else {
        navigate({ to: "/dashboard/attendee" });
      }
      return;
    }

    // Fallback
    setError("Something went wrong. Please try again.");
  }

  return (
    <PageWrapper>
      <div className="flex items-center justify-center bg-[#F9FAFB] px-4 py-16">
        <Card className="w-full max-w-lg p-8" style={{ borderRadius: 12 }}>
          {success ? (
            <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#D946EF]/10">
                <span className="text-2xl">📩</span>
              </div>
              <h3 className="font-semibold text-[#111827]">Check your email</h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                We sent a confirmation link to <strong>{email}</strong>. 
                Click it to activate your AuraPass account.
              </p>
              <p className="mt-3 text-xs text-[#9CA3AF]">
                Didn't receive it? Check your spam folder or{" "}
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-[#D946EF] underline"
                >
                  try again
                </button>
                .
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-center text-2xl font-bold text-[#111827]">
                Create your account
              </h1>
              <p className="mt-1 text-center text-sm text-[#6B7280]">
                Join AuraPass and start accessing the moment.
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Full name"
                  placeholder="Adaeze Okafor"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <div>
                  <p className="mb-2 text-sm font-medium text-[#111827]">
                    I'm signing up as a...
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <RoleCard
                      active={role === "attendee"}
                      onClick={() => setRole("attendee")}
                      icon={<Ticket className="h-5 w-5" />}
                      title="Attendee"
                      desc="I want to discover and attend events"
                    />
                    <RoleCard
                      active={role === "organiser"}
                      onClick={() => setRole("organiser")}
                      icon={<Megaphone className="h-5 w-5" />}
                      title="Organiser"
                      desc="I want to create and sell tickets"
                    />
                  </div>
                </div>

                {error ? (
                  <p className="rounded-md border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                    {typeof error === "string"
                      ? error
                      : (error as { message?: string })?.message
                      ?? "Something went wrong. Please try again."}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={submitting}
                >
                  Create Account
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-[#6B7280]">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-[#D946EF] hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-all duration-200",
        active
          ? "border-[#D946EF] bg-[#FDF4FF] ring-2 ring-[#D946EF]/20"
          : "border-[#E5E7EB] bg-white hover:border-[#D946EF]/60",
      )}
    >
      <div
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md",
          active ? "bg-[#D946EF] text-white" : "bg-[#F3F4F6] text-[#6B7280]",
        )}
      >
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold text-[#111827]">{title}</p>
      <p className="text-xs text-[#6B7280]">{desc}</p>
    </button>
  );
}
