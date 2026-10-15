export type SalesPeriod = 7 | 30 | 90 | "all";

// Events currently have a single scheduled date, not a separate end date.
export function eventSalesEnd(eventDate: string): Date {
  const end = new Date(`${eventDate.slice(0, 10)}T23:59:59`);
  return end;
}

export function isEventEnded(status: string, eventDate: string, now = new Date()): boolean {
  return status === "ended" || eventSalesEnd(eventDate).getTime() < now.getTime();
}

export function salesChartDays(createdDates: string[], period: SalesPeriod, anchor: Date): Date[] {
  const sales = createdDates.map(date => new Date(date)).filter(date => Number.isFinite(date.getTime()));
  if (period === "all" && sales.length === 0) return [];
  const end = period === "all" ? new Date(Math.max(...sales.map(date => date.getTime()))) : new Date(anchor);
  const start = period === "all" ? new Date(Math.min(...sales.map(date => date.getTime()))) : new Date(end);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  if (period !== "all") start.setDate(start.getDate() - period + 1);
  const days: Date[] = [];
  for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) days.push(new Date(day));
  return days;
}