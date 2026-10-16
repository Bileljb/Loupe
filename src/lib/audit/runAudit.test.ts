import { describe, expect, it, vi } from "vitest";
import { mapPsiResult, psiResponseSchema } from "@/lib/checks/psi";
import { fixture, snapshot } from "@/lib/checks/testUtils";
import { reportSchema, type Issue } from "@/lib/schemas";
import { FetchError } from "@/lib/security/errors";
import { PsiError } from "./psiClient";
import { mergeIssues, newReportId, runAudit, type AuditDeps, type AuditProgress } from "./runAudit";

const psiResult = mapPsiResult(psiResponseSchema.parse(JSON.parse(fixture("psi/wordpress-org.json"))));

function deps(overrides: Partial<AuditDeps> = {}): Partial<AuditDeps> {
  return {
    validate: vi.fn(async () => []),
    fetchSnapshot: vi.fn(async () => snapshot(fixture("wordpress.html"))),
    runPsi: vi.fn(async () => psiResult),
    now: () => new Date("2026-10-15T12:00:00.000Z"),
    newId: () => "abcdefghijklmnop",
    ...overrides,
  };
}

const rejectWith = (error: unknown) => vi.fn(async () => Promise.reject(error));

describe("runAudit", () => {
  it("skips the speed test and returns a partial report when the daily budget is spent", async () => {
    const d = deps();
    const report = await runAudit({ url: "rosas-bakery.example" }, { deps: d, allowPsi: async () => false });
    expect(d.runPsi).not.toHaveBeenCalled();
    expect(report.partial).toEqual({ psiFailed: true });
    expect(report.scores.performance).toBeNull();
    expect(report.scores.seo).not.toBeNull();
  });

  it("runs the speed test when the budget allows it", async () => {
    const d = deps();
    const report = await runAudit({ url: "rosas-bakery.example" }, { deps: d, allowPsi: async () => true });
    expect(d.runPsi).toHaveBeenCalledTimes(1);
    expect(report.partial).toBeUndefined();
  });

  it("combines both sources into a valid, sorted report", async () => {
    const report = await runAudit({ url: "Rosas-Bakery.example" }, { deps: deps() });
    expect(reportSchema.safeParse(report).success).toBe(true);
    expect(report).toMatchObject({
      schemaVersion: 1,
      id: "abcdefghijklmnop",
      url: "https://rosas-bakery.example/",
      createdAt: "2026-10-15T12:00:00.000Z",
      localChecks: false,
      platform: { name: "wordpress" },
    });
    expect(report.partial).toBeUndefined();
    expect(report.scores.performance).toBe(74);
    for (const category of ["seo", "technical", "accessibility"] as const) expect(report.scores[category]).not.toBeNull();

    const categories = new Set(report.issues.map((issue) => issue.category));
    expect(categories).toEqual(new Set(["performance", "seo", "technical", "accessibility"]));
    // Failed issues come first.
    const firstPass = report.issues.findIndex((issue) => issue.passed);
    expect(report.issues.slice(firstPass).every((issue) => issue.passed)).toBe(true);
    expect(report.issues.some((issue) => issue.tags?.includes("local"))).toBe(false);
  });

  it("runs PSI and the page checks in parallel", async () => {
    // Each source waits until both have started; run one after the other, this would never finish.
    let started = 0;
    let release: () => void = () => {};
    const bothStarted = new Promise<void>((resolve) => (release = resolve));
    const arrive = async () => {
      if (++started === 2) release();
      await bothStarted;
    };
    const fetchSnapshot = vi.fn(async () => {
      await arrive();
      return snapshot(fixture("good.html"));
    });
    const runPsi = vi.fn(async () => {
      await arrive();
      return psiResult;
    });
    const report = await runAudit({ url: "https://a.example/" }, { deps: deps({ fetchSnapshot, runPsi }) });
    expect(report.partial).toBeUndefined();
  }, 2_000);

  it("adds local checks only when opted in", async () => {
    const report = await runAudit({ url: "https://a.example/", localChecks: true }, { deps: deps() });
    expect(report.localChecks).toBe(true);
    expect(report.issues.some((issue) => issue.tags?.includes("local"))).toBe(true);
  });

  it("returns a partial report when PSI fails", async () => {
    const report = await runAudit({ url: "https://a.example/" }, { deps: deps({ runPsi: rejectWith(new PsiError("PSI_QUOTA")) }) });
    expect(report.partial).toEqual({ psiFailed: true });
    expect(report.scores.performance).toBeNull();
    expect(report.scores.seo).not.toBeNull();
    expect(report.issues.some((issue) => issue.category === "performance")).toBe(false);
  });

  it("returns a partial report when the page fetch fails", async () => {
    const report = await runAudit(
      { url: "https://a.example/" },
      { deps: deps({ fetchSnapshot: rejectWith(new FetchError("TIMEOUT")) }) },
    );
    expect(report.partial).toEqual({ htmlFailed: true });
    expect(report.platform).toBeUndefined();
    expect(report.scores).toMatchObject({ performance: 74, seo: null, technical: null, accessibility: 100 });
    expect(report.issues.every((issue) => issue.category === "performance")).toBe(true);
  });

  it("throws the page error when both sources fail", async () => {
    const failing = deps({ runPsi: rejectWith(new PsiError("PSI_FAILED")), fetchSnapshot: rejectWith(new FetchError("NOT_HTML")) });
    await expect(runAudit({ url: "https://a.example/" }, { deps: failing })).rejects.toMatchObject({ code: "NOT_HTML" });

    const unknown = deps({ runPsi: rejectWith(new Error("x")), fetchSnapshot: rejectWith(new Error("y")) });
    await expect(runAudit({ url: "https://a.example/" }, { deps: unknown })).rejects.toMatchObject({ code: "UNREACHABLE" });
  });

  it("flags a suspected JavaScript-only page", async () => {
    const report = await runAudit(
      { url: "https://a.example/" },
      { deps: deps({ fetchSnapshot: vi.fn(async () => snapshot(fixture("js-shell.html"))) }) },
    );
    expect(report.partial).toEqual({ jsShellSuspected: true });
  });

  it("rejects invalid and blocked URLs before fetching anything", async () => {
    const d = deps();
    await expect(runAudit({ url: "file:///etc/passwd" }, { deps: d })).rejects.toMatchObject({ code: "INVALID_URL" });
    await expect(runAudit({ url: "" }, { deps: d })).rejects.toBeInstanceOf(FetchError);

    const blocked = deps({ validate: rejectWith(new FetchError("BLOCKED")) });
    await expect(runAudit({ url: "https://internal.example/" }, { deps: blocked })).rejects.toMatchObject({ code: "BLOCKED" });
    for (const fn of [d.fetchSnapshot, d.runPsi, blocked.fetchSnapshot, blocked.runPsi]) expect(fn).not.toHaveBeenCalled();
  });

  it("validates with the real SSRF check by default", async () => {
    const d = deps();
    delete d.validate;
    await expect(runAudit({ url: "http://127.0.0.1/" }, { deps: d })).rejects.toMatchObject({ code: "BLOCKED" });
    expect(d.runPsi).not.toHaveBeenCalled();
  });

  it("emits progress events and links re-scans", async () => {
    const events: AuditProgress[] = [];
    const report = await runAudit(
      { url: "https://a.example/" },
      {
        previousReportId: "previous-report-1",
        onProgress: (event) => events.push(event),
        deps: deps({ runPsi: rejectWith(new PsiError("PSI_TIMEOUT")) }),
      },
    );
    expect(report.previousReportId).toBe("previous-report-1");
    expect(events[0]).toEqual({ type: "started", stages: ["performance", "page"] });
    expect(events).toContainEqual({ type: "stage", stage: "performance", status: "failed" });
    expect(events).toContainEqual({ type: "stage", stage: "page", status: "done" });
  });
});

describe("mergeIssues", () => {
  const issue = (id: string, passed: boolean, evidence?: Record<string, unknown>): Issue => ({
    id,
    category: "technical",
    severity: "info",
    passed,
    evidence,
  });

  it("keeps one issue per id and lets a failure win", () => {
    const merged = mergeIssues([issue("a", true), issue("b", false, { from: "psi" })], [issue("a", false), issue("b", true)]);
    expect(merged).toEqual([issue("a", false), issue("b", false, { from: "psi" })]);
  });
});

describe("newReportId", () => {
  it("is url-safe, 12+ chars and unique", () => {
    const ids = new Set(Array.from({ length: 100 }, newReportId));
    expect(ids.size).toBe(100);
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]{16}$/);
  });
});
