export function generateTicketCode(orderId: string): string {
  const prefix = orderId.replace(/-/g, "").slice(0, 8);
  const random = Math.random().toString(36).slice(2, 10);
  return `AURAPASS-${prefix}-${random}`.toUpperCase();
}

/** One QR code per order covering all merch items in it. */
export function generateMerchCode(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const random = Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 12);
  return `MERCH-${random}`.toUpperCase();
}
