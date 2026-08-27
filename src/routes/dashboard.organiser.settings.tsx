import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, ChevronsUpDown } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { UsernameSettings } from "@/components/settings/UsernameSettings";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AvatarUpload } from "@/components/profile/AvatarUpload";
import { getBankList, verifyAndSaveBankAccount } from "@/lib/payouts.functions";

export const Route = createFileRoute("/dashboard/organiser/settings")({
  head: () => ({ meta: [{ title: "Settings | AuraPass" }] }),
  component: () => (
    <ProtectedRoute allowedRoles={["organiser", "admin"]}>
      <OrganiserSettingsPage />
    </ProtectedRoute>
  ),
});

function OrganiserSettingsPage() {
  return (
    <>
      <div className="bg-muted">
        <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account and public profile.
            </p>
          </div>
          <OrganiserProfileSettings />
          <PayoutAccountSettings />
          <UsernameSettings />
        </div>
      </div>
    </>
  );
}

function OrganiserProfileSettings() {
  const { profile } = useAuth();
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url ?? "");
  const [twitterUrl, setTwitterUrl] = useState(profile?.twitter_url ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    const { error: updateError } = await (supabase as any)
      .from("profiles")
      .update({
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
        instagram_url: instagramUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Profile updated.");
    setTimeout(() => setMessage(null), 3000);
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Public Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This information appears on your public profile at{" "}
          <span className="font-medium text-brand-hover break-all">
            aurapassticket.com/organisers/@{profile?.username ?? "yourname"}
          </span>
        </p>
      </div>

      <AvatarUpload
        value={profile?.avatar_url ?? null}
        initials={(profile?.username ?? profile?.full_name ?? "U")
          .slice(0, 2)
          .toUpperCase()}
      />

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell attendees about yourself and the events you run..."
          maxLength={300}
          rows={3}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground-light focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
        />
        <p className="mt-1 text-xs text-muted-foreground-light">{bio.length}/300</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Website
        </label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="https://yourwebsite.com"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Instagram
        </label>
        <input
          type="url"
          value={instagramUrl}
          onChange={(e) => setInstagramUrl(e.target.value)}
          placeholder="https://instagram.com/yourhandle"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Twitter / X
        </label>
        <input
          type="url"
          value={twitterUrl}
          onChange={(e) => setTwitterUrl(e.target.value)}
          placeholder="https://twitter.com/yourhandle"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {message && <p className="text-sm text-success-strong">{message}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </Card>
  );
}

interface SavedAccount {
  bank_name: string;
  account_number: string;
  account_name: string;
}

function PayoutAccountSettings() {
  const { user } = useAuth();
  const fetchBanks = useServerFn(getBankList);
  const verifyAndSave = useServerFn(verifyAndSaveBankAccount);

  const [banks, setBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [bankCode, setBankCode] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [saved, setSaved] = useState<SavedAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await fetchBanks();
        if (active) setBanks(list);
      } catch {
        // bank list failure is non-fatal; select stays empty
      }
      if (user?.id) {
        const { data } = await (supabase as any)
          .from("organiser_bank_accounts")
          .select("bank_name, account_number, account_name")
          .eq("organiser_id", user.id)
          .maybeSingle();
        if (active && data) setSaved(data as SavedAccount);
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  async function handleSubmit() {
    if (!user?.id) return;
    const bank = banks.find((b) => b.code === bankCode);
    if (!bank) {
      setError("Please select a bank.");
      return;
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      setError("Account number must be exactly 10 digits.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await verifyAndSave({
        data: {
          organiserId: user.id,
          accountNumber,
          bankCode: bank.code,
          bankName: bank.name,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(`Verified: ${res.accountName} — saved`);
      setSaved({
        bank_name: bank.name,
        account_number: accountNumber,
        account_name: res.accountName,
      });

      setAccountNumber("");
      setBankCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Payout Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The verified bank account your event earnings will be paid into. Account details
          are verified with your bank before saving.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          {saved && (
            <div className="rounded-lg border border-border bg-muted p-4 text-sm space-y-1">
              <p className="font-medium text-foreground">{saved.bank_name}</p>
              <p className="text-muted-foreground">
                ••••••{saved.account_number.slice(-4)}
              </p>
              <p className="text-success-strong">{saved.account_name}</p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Bank</label>
            <Popover open={bankPickerOpen} onOpenChange={setBankPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {bankCode ? banks.find((b) => b.code === bankCode)?.name : "Select your bank"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Search bank..." />
                  <CommandList>
                    <CommandEmpty>No bank found.</CommandEmpty>
                    <CommandGroup>
                      {banks.map((b) => (
                        <CommandItem
                          key={b.code}
                          value={b.name}
                          onSelect={() => {
                            setBankCode(b.code);
                            setBankPickerOpen(false);
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${bankCode === b.code ? "opacity-100" : "opacity-0"}`}
                          />
                          {b.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Account Number
            </label>
            <Input
              inputMode="numeric"
              maxLength={10}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="10-digit account number"
            />
          </div>

          {message && <p className="text-sm text-success-strong">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSubmit} disabled={submitting || !bankCode || !accountNumber}>
            {submitting ? "Verifying..." : "Verify & Save"}
          </Button>
        </>
      )}
    </Card>
  );
}
