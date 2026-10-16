import { describe, expect, it, vi } from "vitest";
import type { Report } from "@/lib/schemas";
import {
  cacheKey,
  createMemoryStore,
  createReportStorage,
  reportExpiresAt,
  reportKey,
  reportTtlDays,
  type KeyValueStore,
} from "./reports";

const report: Report = {
  schemaVersion: 1,
  id: "abcdefghijklmnop",
  url: "https://rosas-bakery.example/",
  createdAt: "2026-10-15T12:00:00.000Z",
  scores: { overall: 82, performance: 74, seo: 86, accessibility: 90, technical: 79 },
  issues: [{ id: "seo.title.missing", category: "seo", severity: "critical", passed: false, evidence: { title: null } }],
  platform: { name: "wordpress", confidence: "high" },
  localChecks: false,
};

const DAY = 24 * 60 * 60 * 1000;

function setup(ttlDays = 30) {
  let now = Date.parse("2026-10-15T12:00:00.000Z");
  const store = createMemoryStore(() => now);
  return {
    store,
    storage: createReportStorage(store, ttlDays),
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe("report storage", () => {
  it("returns a saved report unchanged", async () => {
    const { storage } = setup();
    await storage.saveReport(report);
    expect(await storage.getReport(report.id)).toEqual({ status: "found", report });
  });

  it("saves with the report TTL, in seconds", async () => {
    const store: KeyValueStore = { get: vi.fn(), set: vi.fn(async () => {}) };
    await createReportStorage(store, 7).saveReport(report);
    expect(store.set).toHaveBeenCalledWith("report:abcdefghijklmnop", report, 7 * 24 * 60 * 60);
  });

  it("reports a missing id as not found", async () => {
    const { storage } = setup();
    expect(await storage.getReport("zzzzzzzzzzzzzzzz")).toEqual({ status: "not_found" });
  });

  it("reports an expired report as not found", async () => {
    const { storage, advance } = setup(30);
    await storage.saveReport(report);
    advance(29 * DAY);
    expect((await storage.getReport(report.id)).status).toBe("found");
    advance(2 * DAY);
    expect(await storage.getReport(report.id)).toEqual({ status: "not_found" });
  });

  it.each(["short", "has spaces in it!", "../../etc/passwd", "a".repeat(65), "x:y:zzzzzzzzzzzz"])(
    "never looks up a malformed id (%s)",
    async (id) => {
      const store: KeyValueStore = { get: vi.fn(), set: vi.fn() };
      expect(await createReportStorage(store).getReport(id)).toEqual({ status: "not_found" });
      expect(store.get).not.toHaveBeenCalled();
    },
  );

  it("flags a report saved with another schema version instead of crashing", async () => {
    const { store, storage } = setup();
    await store.set(reportKey(report.id), { ...report, schemaVersion: 2, scores: "new shape" }, 60);
    expect(await storage.getReport(report.id)).toEqual({ status: "unsupported_version" });
  });

  it("treats a damaged report as not found", async () => {
    const { store, storage } = setup();
    await store.set(reportKey(report.id), { ...report, scores: null }, 60);
    expect(await storage.getReport(report.id)).toEqual({ status: "not_found" });
    await store.set(reportKey(report.id), "not a report", 60);
    expect(await storage.getReport(report.id)).toEqual({ status: "not_found" });
  });
});

describe("result cache", () => {
  it("remembers a report id for one hour", async () => {
    const { storage, advance } = setup();
    await storage.setCachedReportId(report.url, false, report.id);
    expect(await storage.getCachedReportId(report.url, false)).toBe(report.id);
    advance(60 * 60 * 1000);
    expect(await storage.getCachedReportId(report.url, false)).toBeNull();
  });

  it("keeps audits with and without local checks apart", async () => {
    const { storage } = setup();
    await storage.setCachedReportId(report.url, false, report.id);
    expect(await storage.getCachedReportId(report.url, true)).toBeNull();
  });

  it("uses a stable sha256 key that doesn't depend on language", () => {
    const key = cacheKey("https://rosas-bakery.example/", false);
    expect(key).toMatch(/^cache:[0-9a-f]{64}$/);
    expect(cacheKey("https://rosas-bakery.example/", false)).toBe(key);
    expect(cacheKey("https://rosas-bakery.example/", true)).not.toBe(key);
    expect(cacheKey("https://other.example/", false)).not.toBe(key);
  });
});

describe("expiry", () => {
  it("reads REPORT_TTL_DAYS and falls back to 30 days", () => {
    expect(reportTtlDays("7")).toBe(7);
    for (const value of [undefined, "", "0", "-3", "1.5", "abc"]) expect(reportTtlDays(value)).toBe(30);
  });

  it("is the creation date plus the TTL", () => {
    expect(reportExpiresAt(report, 30).toISOString()).toBe("2026-11-14T12:00:00.000Z");
  });
});
