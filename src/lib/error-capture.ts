// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

// A client that disconnects mid-request (navigation, refresh, HMR reload)
// surfaces as `Error: aborted` from node:_http_server. It is not an app fault.
export function isClientAbortError(error: unknown): boolean {
  if (!error) return false;
  const e = error as { name?: string; message?: string; code?: string; cause?: unknown };
  if (e.name === "AbortError" || e.code === "ECONNRESET" || e.code === "ABORT_ERR") return true;
  if (typeof e.message === "string" && /^aborted$/i.test(e.message.trim())) return true;
  return e.cause ? isClientAbortError(e.cause) : false;
}

function record(error: unknown) {
  if (isClientAbortError(error)) return;
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
  globalThis.addEventListener("unhandledrejection", (event) =>
    record((event as PromiseRejectionEvent).reason),
  );
}


export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
