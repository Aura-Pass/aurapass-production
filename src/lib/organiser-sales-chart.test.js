import { describe, expect, test } from "bun:test";
import { eventSalesEnd, isEventEnded, salesChartDays } from "./organiser-sales-chart";

describe("organiser sales chart windows", () => {
  test("ended status and past scheduled dates both count as ended", () => {
    const now = new Date("2026-10-15T20:19:00Z");
    expect(isEventEnded("published", "2026-06-20", now)).toBe(true);
    expect(isEventEnded("published", "2026-12-20", now)).toBe(false);
    expect(isEventEnded("ended", "2026-12-20", now)).toBe(true);
  });
  test("7D/30D/90D end on the ended event's date, not today", () => {
    for (const period of [7, 30, 90]) {
      const days = salesChartDays(["2026-06-19T12:00:00"], period, eventSalesEnd("2026-06-20"));
      expect(days.length).toBe(period);
      expect(days.at(-1)?.toDateString()).toBe(new Date("2026-06-20T00:00:00").toDateString());
      expect(days.some(day => day.toDateString() === new Date("2026-06-19T12:00:00").toDateString())).toBe(true);
    }
  });
  test("All time spans first sale through last sale, including empty days", () => {
    const days = salesChartDays(["2026-06-04T12:00:00", "2026-06-01T12:00:00"], "all", new Date("2026-10-15"));
    expect(days.map(day => day.getDate())).toEqual([1, 2, 3, 4]);
  });
  test("no sales is empty and a single sale has one day", () => {
    expect(salesChartDays([], "all", new Date())).toEqual([]);
    expect(salesChartDays(["2026-06-01T12:00:00"], "all", new Date())).toHaveLength(1);
  });
  test("active event windows still anchor to today", () => {
    const now = new Date("2026-10-15T12:00:00");
    const days = salesChartDays([], 7, now);
    expect(days.map(day => day.getDate())).toEqual([9, 10, 11, 12, 13, 14, 15]);
  });
});