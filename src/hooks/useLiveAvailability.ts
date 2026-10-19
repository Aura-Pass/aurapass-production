import { useEffect, useRef } from "react";

/**
 * Keeps public ticket availability fresh without exposing exact stock.
 *
 * Calls `refresh` every `intervalMs` while the tab is visible, and immediately
 * when the tab becomes visible again or the network returns. Stops entirely
 * when the tab is hidden, so idle tabs cost nothing.
 *
 * (Realtime is intentionally NOT used here: ticket_types.quantity_sold is
 * hidden from the public by get_ticket_availability(), and a realtime
 * broadcast would leak it.)
 */
export function useLiveAvailability(
  refresh: () => void | Promise<void>,
  enabled: boolean,
  intervalMs = 20_000,
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => void refreshRef.current(), intervalMs);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshRef.current();
        start();
      } else {
        stop();
      }
    };
    const onOnline = () => void refreshRef.current();

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [enabled, intervalMs]);
}
