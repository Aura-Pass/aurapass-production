/**
 * BecomeOrganiserCard — self-serve organiser onboarding.
 *
 * Multi-role system: this INSERTS a row into `user_roles`
 * (role: 'organiser', status: 'active') instead of overwriting profiles.role.
 * profiles.role is still kept in sync for legacy display badges.
 * On success we refresh activeRoles so the dashboard sidebar updates
 * immediately — no page reload required.
 */
import { useState } from "react";
import { Megaphone } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

interface Props {
  fullName: string;
  email: string;
}

const MIN_LEN = 20;

export function BecomeOrganiserCard({ fullName, email }: Props) {
  const { user, activeRoles, refreshRoles } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const trimmed = message.trim();
  const valid = trimmed.length >= MIN_LEN;
  const alreadyOrganiser = activeRoles.includes("organiser");

  async function handleSubmit() {
    if (!valid || !user) return;
    setSubmitting(true);

    const { error } = await (supabase as any)
      .from("user_roles")
      .insert({ user_id: user.id, role: "organiser", status: "active" });

    // Duplicate row means the role already exists — treat as success.
    const duplicate = error?.code === "23505";

    if (error && !duplicate) {
      setSubmitting(false);
      toast.error(error.message ?? "Could not enable organiser access. Please try again.");
      return;
    }

    // Legacy sync: keep profiles.role reflecting the user's "primary" role.
    await (supabase as any).from("profiles").update({ role: "organiser" }).eq("id", user.id);

    await refreshRoles();
    setSubmitting(false);
    setOpen(false);
    setMessage("");
    toast.success("You're an organiser now — start creating events!");
    navigate({ to: "/dashboard/organiser" });
  }

  if (alreadyOrganiser) return null;

  return (
    <>
      <Card className="p-6" style={{ borderRadius: 12 }}>
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FDF4FF] text-[#A21CAF]">
            <Megaphone className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-[#111827]">
              Become an Organiser
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Host and sell tickets to your own events on AuraPass. Organiser access
              is instant — you keep your attendee account too.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setOpen(true)}
              >
                Become an Organiser
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Become an organiser</DialogTitle>
            <DialogDescription>
              Tell us briefly about the events you plan to host. Organiser tools
              unlock straight away.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="e.g. I run monthly afrobeats parties in Ilorin..."
          />
          <p className="text-xs text-[#6B7280]">
            {trimmed.length}/{MIN_LEN} characters minimum
            {fullName || email ? ` · ${fullName || email}` : ""}
          </p>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!valid}
              loading={submitting}
              onClick={handleSubmit}
            >
              Enable organiser access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
