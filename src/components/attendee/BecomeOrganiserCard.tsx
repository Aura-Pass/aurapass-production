import { useState } from "react";
import { Megaphone } from "lucide-react";
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

interface Props {
  fullName: string;
  email: string;
}

const MIN_LEN = 20;

export function BecomeOrganiserCard({ fullName, email }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const trimmed = message.trim();
  const valid = trimmed.length >= MIN_LEN;

  function handleSubmit() {
    if (!valid) return;
    const subject = `Organiser Access Request — ${fullName || "AuraPass user"}`;
    const body =
      `Name: ${fullName || "(not provided)"}\n` +
      `Email: ${email || "(not provided)"}\n\n` +
      `About my events:\n${trimmed}`;
    const href =
      `mailto:support@aurapassticket.com` +
      `?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`;
    if (typeof window !== "undefined") {
      window.location.href = href;
    }
    setOpen(false);
  }

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
              Host and sell tickets to your own events on AuraPass. Request access
              and our team will get in touch.
            </p>
            <div className="mt-4">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => setOpen(true)}
              >
                Request Access
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request organiser access</DialogTitle>
            <DialogDescription>
              Tell us briefly about the events you plan to organise. Minimum{" "}
              {MIN_LEN} characters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about the events you plan to organise"
              rows={5}
              className="min-h-[120px]"
            />
            <p className="text-xs text-[#6B7280]">
              {trimmed.length}/{MIN_LEN} minimum
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!valid}
              onClick={handleSubmit}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
