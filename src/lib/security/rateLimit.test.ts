import { describe, expect, it } from "vitest";
import { auditsPerHour, clientKey, minutesUntil, psiDailyCap } from "./rateLimit";

describe("clientKey", () => {
  const key = (headers: Record<string, string>) => clientKey(new Headers(headers));

  it("uses the first X-Forwarded-For address, hashed", () => {
    expect(key({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" })).toBe(key({ "x-forwarded-for": "203.0.113.7" }));
    expect(key({ "x-forwarded-for": "203.0.113.7" })).toMatch(/^[0-9a-f]{32}$/);
    expect(key({ "x-forwarded-for": "203.0.113.7" })).not.toBe(key({ "x-forwarded-for": "203.0.113.8" }));
  });

  it("falls back to X-Real-IP, then a shared bucket", () => {
    expect(key({ "x-real-ip": "203.0.113.7" })).toBe(key({ "x-forwarded-for": "203.0.113.7" }));
    expect(key({})).toBe(key({ "x-forwarded-for": "" }));
  });
});

describe("limits from env", () => {
  it("defaults to 5 audits per hour and 1000 speed tests a day", () => {
    expect(auditsPerHour(undefined)).toBe(5);
    expect(psiDailyCap(undefined)).toBe(1000);
    expect(auditsPerHour("12")).toBe(12);
    for (const bad of ["", "0", "-1", "2.5", "lots"]) expect(auditsPerHour(bad)).toBe(5);
  });
});

describe("minutesUntil", () => {
  it("rounds up to whole minutes, at least one", () => {
    expect(minutesUntil(1_000 + 25 * 60_000 + 1, 1_000)).toBe(26);
    expect(minutesUntil(1_000, 1_000)).toBe(1);
  });
});
