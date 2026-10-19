import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { toEventCardData } from "./event-adapter";

const detailSource = readFileSync(new URL("../routes/events.$slug.index.tsx", import.meta.url), "utf8");
const soldOutBody = detailSource.match(/const isSoldOut = \(id: string\) => \{([\s\S]*?)\n  \};/)?.[1];
if (!soldOutBody) throw new Error("Ticket availability predicate is missing");
const evaluateSoldOut = new Function("id", "soldOutIds", "availability", soldOutBody);

describe("Release 1 ticket rules", () => {
  test("a public sold-out ID cannot be bought even without exact stock", () => {
    expect(evaluateSoldOut("vip", new Set(["vip"]), {})).toBe(true);
    expect(evaluateSoldOut("standard", new Set(["vip"]), {})).toBe(false);
  });

  test("zero remaining is sold out for public and privileged availability", () => {
    expect(evaluateSoldOut("vip", new Set(), { vip: { type: "public", remaining: 0 } })).toBe(true);
    expect(evaluateSoldOut("vip", new Set(), { vip: { type: "privileged", remaining: 0 } })).toBe(true);
    expect(evaluateSoldOut("vip", new Set(), { vip: { type: "privileged", remaining: 1 } })).toBe(false);
  });

  test("archived ticket categories do not affect event card prices", () => {
    const result = toEventCardData({
      ticket_types: [
        { price: 0, is_hidden: true },
        { price: 8000, is_hidden: false },
        { price: 12000, is_hidden: false },
        { price: 250000, is_hidden: true },
      ],
    });
    expect(result.min_price).toBe(8000);
    expect(result.max_price).toBe(12000);
    expect(result.is_free).toBe(false);
  });

  test("admin featured selection has an eight-event limit", () => {
    const source = readFileSync(new URL("../routes/dashboard.admin.featured.tsx", import.meta.url), "utf8");
    const limit = source.match(/const MAX_FEATURED = (\d+);/)?.[1];
    expect(Number(limit)).toBe(8);
  });
});