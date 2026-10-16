import { describe, expect, it } from "vitest";
import { newReportId } from "@/lib/audit/runAudit";
import type { Report } from "@/lib/schemas";
import { createRedisStore } from "./redis";
import { createReportStorage } from "./reports";

// Talks to the real Upstash database. Run with:
// RUN_REDIS_TESTS=1 node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/storage/redis.test.ts
describe.skipIf(!process.env.RUN_REDIS_TESTS)("report storage (real Upstash)", () => {
  it("round-trips a report and a cache entry", async () => {
    const store = createRedisStore();
    // A one-day TTL so test data cleans itself up.
    const storage = createReportStorage(store, 1);
    const report: Report = {
      schemaVersion: 1,
      id: newReportId(),
      url: "https://redis-test.example/",
      createdAt: new Date().toISOString(),
      scores: { overall: 50, performance: null, seo: 50, accessibility: 50, technical: 50 },
      issues: [{ id: "seo.title.missing", category: "seo", severity: "critical", passed: false, evidence: { title: "<b>&</b>" } }],
      localChecks: false,
    };

    await storage.saveReport(report);
    expect(await storage.getReport(report.id)).toEqual({ status: "found", report });
    expect(await storage.getReport(newReportId())).toEqual({ status: "not_found" });

    await storage.setCachedReportId(report.url, false, report.id);
    expect(await storage.getCachedReportId(report.url, false)).toBe(report.id);
  });
});
