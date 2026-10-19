import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/compress-image";

// WhatsApp / Facebook ignore link-preview images larger than ~300 KB.
const LIMIT_BYTES = 300 * 1024;

interface Row {
  id: string;
  title: string;
  banner_url: string;
  bytes: number;
}

/**
 * Admin one-click fix for existing event banners that are too big for link previews.
 * Re-compresses in the browser, uploads the smaller copy and points the event at it.
 * Uses the admin's existing permissions; does NOT change event status (no re-review).
 * The original files are left in storage untouched.
 */
export function OptimiseBanners() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, failed: 0 });

  async function scan() {
    setScanning(true);
    setProgress({ done: 0, failed: 0 });
    try {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("id, title, banner_url")
        .eq("status", "published")
        .not("banner_url", "is", null);
      if (error) throw new Error(error.message);

      const found: Row[] = [];
      for (const e of (data as any[]) ?? []) {
        if (!e.banner_url) continue;
        try {
          const head = await fetch(e.banner_url, { method: "HEAD" });
          const bytes = Number(head.headers.get("content-length") ?? 0);
          if (bytes > LIMIT_BYTES) {
            found.push({ id: e.id, title: e.title, banner_url: e.banner_url, bytes });
          }
        } catch {
          /* skip unreachable banner */
        }
      }
      found.sort((a, b) => b.bytes - a.bytes);
      setRows(found);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not scan banners.");
    } finally {
      setScanning(false);
    }
  }

  async function optimiseAll() {
    if (!rows?.length) return;
    setRunning(true);
    let done = 0;
    let failed = 0;
    const remaining: Row[] = [];
    for (const r of rows) {
      try {
        const res = await fetch(r.banner_url);
        const blob = await res.blob();
        const original = new File([blob], "banner", { type: blob.type || "image/jpeg" });
        const smaller = await compressImage(original);
        if (smaller.size >= original.size || smaller.size > LIMIT_BYTES) {
          failed++;
          remaining.push(r);
          continue;
        }
        const name = `${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("event-banners")
          .upload(name, smaller, { cacheControl: "31536000", upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: pub } = supabase.storage.from("event-banners").getPublicUrl(name);
        const { error: updErr } = await (supabase as any)
          .from("events")
          .update({ banner_url: pub.publicUrl })
          .eq("id", r.id);
        if (updErr) throw new Error(updErr.message);
        done++;
      } catch (err) {
        console.error("[optimise-banners]", r.title, err);
        failed++;
        remaining.push(r);
      }
      setProgress({ done, failed });
    }
    setRows(remaining);
    setRunning(false);
    toast[failed ? "warning" : "success"](
      `${done} banner${done === 1 ? "" : "s"} optimised${failed ? `, ${failed} could not be fixed` : ""}.`,
    );
  }

  return (
    <Card className="p-4 md:p-5" style={{ borderRadius: 12 }}>
      <h2 className="text-base font-semibold text-foreground">WhatsApp link previews</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        WhatsApp only shows an event's banner in a shared link if the image is under ~300 KB.
        Scan for published events whose banner is too large, then optimise them in one click.
        Event status is not changed.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" onClick={scan} disabled={scanning || running}>
          {scanning ? "Scanning…" : "Scan banners"}
        </Button>
        {rows && rows.length > 0 && (
          <Button type="button" variant="primary" onClick={optimiseAll} disabled={running}>
            {running
              ? `Optimising… ${progress.done + progress.failed}/${rows.length + progress.done}`
              : `Optimise ${rows.length} banner${rows.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>
      {rows && rows.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">All published banners are small enough.</p>
      )}
      {rows && rows.length > 0 && (
        <ul className="mt-3 divide-y divide-border text-sm">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0 truncate text-foreground">{r.title}</span>
              <span className="shrink-0 text-muted-foreground">{Math.round(r.bytes / 1024)} KB</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
