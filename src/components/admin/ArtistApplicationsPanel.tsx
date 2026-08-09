/**
 * ArtistApplicationsPanel — admin moderation for artist_profiles.
 * Approve / reject go through the SECURITY DEFINER RPCs (never direct updates).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import type { ArtistProfile, ArtistStatus } from "@/lib/artists";

export function ArtistApplicationsPanel() {
  const [rows, setRows] = useState<ArtistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<ArtistStatus>("pending_review");
  const [rejectTarget, setRejectTarget] = useState<ArtistProfile | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("artist_profiles")
      .select("*")
      .order("submitted_at", { ascending: true });
    if (error) toast.error(error.message ?? "Could not load artist applications.");
    setRows(((data as ArtistProfile[] | null) ?? []));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      pending_review: rows.filter((r) => r.status === "pending_review").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    }),
    [rows],
  );

  const filtered = rows.filter((r) => r.status === subTab);

  async function approve(app: ArtistProfile) {
    setWorking(true);
    const { error } = await (supabase as any).rpc("approve_artist_application", {
      application_id: app.id,
    });
    setWorking(false);
    if (error) {
      toast.error(error.message ?? "Approval failed.");
      return;
    }
    toast.success(`${app.stage_name} approved as an artist.`);
    void load();
  }

  async function confirmReject() {
    if (!rejectTarget) return;
    const trimmed = reason.trim();
    if (trimmed.length < 10) {
      toast.error("Please provide at least 10 characters.");
      return;
    }
    setWorking(true);
    const { error } = await (supabase as any).rpc("reject_artist_application", {
      application_id: rejectTarget.id,
      reason: trimmed,
    });
    setWorking(false);
    if (error) {
      toast.error(error.message ?? "Rejection failed.");
      return;
    }
    toast.success("Application rejected.");
    setRejectTarget(null);
    setReason("");
    void load();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {(["pending_review", "approved", "rejected"] as ArtistStatus[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSubTab(s)}
            className={
              subTab === s
                ? "rounded-full bg-[#FDF4FF] px-3 py-1 text-sm font-semibold text-[#A21CAF]"
                : "rounded-full px-3 py-1 text-sm text-[#6B7280] hover:text-[#A21CAF]"
            }
          >
            {s === "pending_review" ? "Pending" : s === "approved" ? "Approved" : "Rejected"} (
            {counts[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 p-10 text-center" style={{ borderRadius: 12 }}>
          <p className="text-[#6B7280]">No artist applications in this state.</p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4">
          {filtered.map((app) => (
            <Card key={app.id} className="p-5" style={{ borderRadius: 12 }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#111827]">{app.stage_name}</h3>
                  <p className="text-xs text-[#6B7280]">
                    Submitted {formatDate(app.submitted_at)}
                  </p>
                </div>
                {app.status === "pending_review" ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={working}
                      onClick={() => approve(app)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={working}
                      onClick={() => {
                        setRejectTarget(app);
                        setReason("");
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                ) : null}
              </div>

              {app.bio ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-[#374151]">{app.bio}</p>
              ) : null}

              {app.genres.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.genres.map((g) => (
                    <Badge key={g} className="bg-[#FDF4FF] text-[#A21CAF] hover:bg-[#FDF4FF]">
                      {g}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {app.rate_info ? (
                <p className="mt-3 text-sm text-[#111827]">
                  <span className="font-medium">Rate:</span> {app.rate_info}
                </p>
              ) : null}

              {app.photo_urls.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {app.photo_urls.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt={app.stage_name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ))}
                </div>
              ) : null}

              {app.video_links.length ? (
                <ul className="mt-3 space-y-1">
                  {app.video_links.map((v) => (
                    <li key={v}>
                      <a
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#A21CAF] underline break-all"
                      >
                        {v}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              {app.status === "rejected" && app.rejection_reason ? (
                <p className="mt-3 rounded-md bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C]">
                  {app.rejection_reason}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && !working) {
            setRejectTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="bg-white sm:max-w-lg" style={{ borderRadius: 12 }}>
          <DialogHeader>
            <DialogTitle className="text-[#111827]">Reject artist application</DialogTitle>
            <DialogDescription className="text-[#6B7280]">
              The applicant will see this reason and can edit and resubmit.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={5}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Photos are low quality, video links don't show a live performance..."
          />
          <p className="text-xs text-[#6B7280]">{reason.trim().length} / 10 characters minimum</p>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={working}
              onClick={() => {
                setRejectTarget(null);
                setReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmReject}
              disabled={working || reason.trim().length < 10}
              className="bg-[#EF4444] text-white hover:bg-[#DC2626]"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
