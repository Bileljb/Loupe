import { describe, expect, it } from "vitest";
import { makeIssue } from "@/lib/checks/registry";
import type { Report } from "@/lib/schemas";
import { buildDeveloperMessage, type DeveloperMessageLabels } from "./developerMessage";
import { blockedStatus, exampleReport, trustedPlatform, vitalsFrom } from "./index";

describe("example report", () => {
  it("is a valid report with failed issues and a detected platform", () => {
    const report = exampleReport();
    expect(report.issues.some((issue) => !issue.passed)).toBe(true);
    expect(trustedPlatform(report)).toBe("wordpress");
  });
});

describe("trustedPlatform", () => {
  const base = exampleReport();
  it.each([
    [{ name: "wix", confidence: "medium" }, "wix"],
    [{ name: "wix", confidence: "low" }, null],
    [{ name: "unknown", confidence: "high" }, null],
    [undefined, null],
  ] as const)("%o -> %s", (platform, expected) => {
    const report: Report = { ...base, ...(platform ? { platform: { ...platform } } : { platform: undefined }) };
    expect(trustedPlatform(report)).toBe(expected);
  });
});

describe("vitalsFrom", () => {
  it("reads metric issues in a fixed order, in seconds where it makes sense", () => {
    const vitals = vitalsFrom([
      makeIssue("performance.cls.high", true, { metric: "CLS", value: 0.02 }),
      makeIssue("performance.lcp.slow", false, { metric: "LCP", value: 5476 }),
      makeIssue("seo.title.missing", false),
      makeIssue("performance.interactivity.slow", false, { metric: "TBT", value: 212 }),
    ]);
    expect(vitals).toEqual([
      { key: "lcp", good: false, seconds: 5.5 },
      { key: "cls", good: true },
      { key: "interactivity", good: false },
    ]);
  });
});

describe("blockedStatus", () => {
  it("returns the status only when the page answered with an error", () => {
    expect(blockedStatus([makeIssue("technical.status.error", false, { status: 403 })])).toBe(403);
    expect(blockedStatus([makeIssue("technical.status.error", true, { status: 200 })])).toBeNull();
    expect(blockedStatus([])).toBeNull();
  });
});

describe("buildDeveloperMessage", () => {
  const labels: DeveloperMessageLabels = {
    heading: "Fixes for https://rosas-bakery.example/",
    checkedOn: "Checked on 1 October 2026",
    report: "Full report: https://loupe.example/en/report/abc",
    platform: "Platform: WordPress",
    groups: { critical: "Critical", warning: "Warning", info: "Minor" },
    fix: "Fix",
    evidence: "Evidence",
    example: "Example",
    none: "No failed checks.",
  };
  const entries: Record<string, { title: string; fix: string; platformFix?: string; snippet?: string }> = {
    "seo.title.missing": { title: "No title", fix: "Add a title.", platformFix: "Use Yoast.", snippet: "<title>Rosa</title>" },
    "technical.favicon.missing": { title: "No icon", fix: "Add an icon." },
    "seo.viewport.missing": { title: "No viewport", fix: "Add the tag." },
  };
  const entryFor = (issue: { id: string }) => entries[issue.id] ?? { title: "?", fix: "?" };

  it("groups failed issues by priority with ids, evidence and examples", () => {
    const message = buildDeveloperMessage(
      [
        makeIssue("seo.title.missing", false, { title: null }),
        makeIssue("seo.viewport.missing", false),
        makeIssue("technical.favicon.missing", false),
        makeIssue("seo.h1.missing", true),
      ],
      entryFor,
      labels,
    );
    expect(message).toBe(
      [
        "Fixes for https://rosas-bakery.example/",
        "Checked on 1 October 2026",
        "Full report: https://loupe.example/en/report/abc",
        "Platform: WordPress",
        "",
        "== Critical (1) ==",
        "",
        "1. [seo.title.missing] No title",
        "   Fix: Use Yoast.",
        '   Evidence: {"title":null}',
        "   Example:",
        "     <title>Rosa</title>",
        "",
        "== Warning (1) ==",
        "",
        "2. [seo.viewport.missing] No viewport",
        "   Fix: Add the tag.",
        "",
        "== Minor (1) ==",
        "",
        "3. [technical.favicon.missing] No icon",
        "   Fix: Add an icon.",
      ].join("\n"),
    );
  });

  it("says so when nothing failed", () => {
    expect(buildDeveloperMessage([makeIssue("seo.h1.missing", true)], entryFor, labels)).toMatch(/No failed checks\.$/);
  });

  it("caps very long evidence", () => {
    const message = buildDeveloperMessage(
      [makeIssue("technical.favicon.missing", false, { list: "x".repeat(5000) })],
      entryFor,
      labels,
    );
    expect(message.length).toBeLessThan(1500);
    expect(message).toContain("…");
  });
});
