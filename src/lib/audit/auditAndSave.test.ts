import { describe, expect, it, vi } from "vitest";
import { mapPsiResult, psiResponseSchema } from "@/lib/checks/psi";
import { fixture, snapshot } from "@/lib/checks/testUtils";
import { FetchError } from "@/lib/security/errors";
import { createMemoryStore, createReportStorage, type ReportStorage } from "@/lib/storage/reports";
import { auditAndSave } from "./auditAndSave";
import type { AuditDeps } from "./runAudit";

const psiResult = mapPsiResult(psiResponseSchema.parse(JSON.parse(fixture("psi/wordpress-org.json"))));

function deps(overrides: Partial<AuditDeps> = {}) {
  let n = 0;
  return {
    validate: vi.fn(async () => []),
    fetchSnapshot: vi.fn(async () => snapshot(fixture("wordpress.html"))),
    runPsi: vi.fn(async () => psiResult),
    now: () => new Date("2026-10-15T12:00:00.000Z"),
    newId: () => `report-id-000000${n++}`,
    ...overrides,
  };
}

const memoryStorage = () => createReportStorage(createMemoryStore());

describe("auditAndSave", () => {
  it("saves the report so its link works", async () => {
    const storage = memoryStorage();
    const { report, cached } = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: deps() });
    expect(cached).toBe(false);
    expect(await storage.getReport(report.id)).toEqual({ status: "found", report });
  });

  it("reuses a recent report of the same page instead of calling PSI again", async () => {
    const storage = memoryStorage();
    const d = deps();
    const first = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    // A different spelling of the same address hits the same cache entry.
    const second = await auditAndSave({ url: "https://ROSAS-BAKERY.example/#top" }, { storage, deps: d });
    expect(second).toEqual({ report: first.report, cached: true });
    expect(d.runPsi).toHaveBeenCalledTimes(1);
  });

  it("re-scans with a fresh audit linked to the previous report", async () => {
    const storage = memoryStorage();
    const d = deps();
    const first = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    const rescan = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d, rescanOf: first.report.id });
    expect(rescan.cached).toBe(false);
    expect(rescan.report.id).not.toBe(first.report.id);
    expect(rescan.report.previousReportId).toBe(first.report.id);
    expect(d.runPsi).toHaveBeenCalledTimes(2);
    expect(await storage.getReport(rescan.report.id)).toEqual({ status: "found", report: rescan.report });
    // The re-scan's compare view isn't handed to the next visitor.
    const next = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    expect(next.report.id).toBe(first.report.id);
  });

  it("re-scans the previous report's page and settings, whatever the request says", async () => {
    const storage = memoryStorage();
    const d = deps();
    const first = await auditAndSave({ url: "rosas-bakery.example", localChecks: true }, { storage, deps: d });
    const rescan = await auditAndSave(
      { url: "someone-else.example", localChecks: false },
      { storage, deps: d, rescanOf: first.report.id },
    );
    expect(rescan.report.url).toBe("https://rosas-bakery.example/");
    expect(rescan.report.localChecks).toBe(true);
    expect(rescan.report.previousReportId).toBe(first.report.id);
  });

  it("runs a plain fresh audit when the previous report has expired", async () => {
    const storage = memoryStorage();
    const d = deps();
    await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    const rescan = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d, rescanOf: "expired-report-01" });
    expect(rescan.cached).toBe(false);
    expect(rescan.report.previousReportId).toBeUndefined();
  });

  it("keeps local-business audits separate from standard ones", async () => {
    const storage = memoryStorage();
    const d = deps();
    await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    const local = await auditAndSave({ url: "rosas-bakery.example", localChecks: true }, { storage, deps: d });
    expect(local.cached).toBe(false);
    expect(local.report.localChecks).toBe(true);
  });

  it("doesn't cache a partial report", async () => {
    const storage = memoryStorage();
    const d = deps({ runPsi: vi.fn(async () => Promise.reject(new Error("quota"))) });
    const first = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    expect(first.report.partial?.psiFailed).toBe(true);
    const second = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: d });
    expect(second.cached).toBe(false);
  });

  it("still audits when the cache can't be read or written", async () => {
    const storage: ReportStorage = {
      ...memoryStorage(),
      getCachedReportId: vi.fn(async () => Promise.reject(new Error("redis down"))),
      setCachedReportId: vi.fn(async () => Promise.reject(new Error("redis down"))),
    };
    const { cached } = await auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: deps() });
    expect(cached).toBe(false);
  });

  it("fails when the report can't be saved, since there would be no link", async () => {
    const storage: ReportStorage = {
      ...memoryStorage(),
      saveReport: vi.fn(async () => Promise.reject(new Error("redis down"))),
    };
    await expect(auditAndSave({ url: "rosas-bakery.example" }, { storage, deps: deps() })).rejects.toThrow(
      "redis down",
    );
  });

  it("rejects invalid input before touching storage", async () => {
    const storage: ReportStorage = { ...memoryStorage(), getCachedReportId: vi.fn() };
    await expect(auditAndSave({ url: "file:///etc/passwd" }, { storage, deps: deps() })).rejects.toBeInstanceOf(
      FetchError,
    );
    expect(storage.getCachedReportId).not.toHaveBeenCalled();
  });
});
