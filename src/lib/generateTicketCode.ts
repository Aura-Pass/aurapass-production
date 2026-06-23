export function generateTicketCode(orderId: string): string {
  const prefix = orderId.replace(/-/g, "").slice(0, 8);
  const random = Math.random().toString(36).slice(2, 10);
  return `AURAPASS-${prefix}-${random}`.toUpperCase();
}
