import { describe, expect, it } from "vitest";
import { issueSchema } from "@/lib/schemas";
import { checkIds, checkRegistry, runHtmlChecks } from "./index";
import { snapshot, fixture, failedIds } from "./testUtils";

// HTML checks only: performance ids come from PageSpeed Insights.
const nonLocalIds = checkIds.filter(
  (id) => !("local" in checkRegistry[id]) && checkRegistry[id].category !== "performance",
);
const localIds = checkIds.filter((id) => "local" in checkRegistry[id]);

describe("runHtmlChecks on a healthy page", () => {
  const result = runHtmlChecks(snapshot(fixture("good.html")), { localChecks: false });

  it("passes every check", () => {
    expect(failedIds(result.issues)).toEqual([]);
  });

  it("runs every non-local check exactly once", () => {
    expect(result.issues.map((issue) => issue.id).sort()).toEqual([...nonLocalIds].sort());
  });

  it("is not flagged as a JavaScript shell and has no platform", () => {
    expect(result.jsShellSuspected).toBe(false);
    expect(result.platform).toEqual({ name: "unknown", confidence: "low" });
  });
});

describe("runHtmlChecks on a broken page", () => {
  const result = runHtmlChecks(
    snapshot(fixture("bad.html"), {
      status: 500,
      headers: { "content-type": "text/html" },
      redirects: [
        { url: "http://shop.example/", status: 301 },
        { url: "https://shop.example/", status: 302 },
        { url: "https://www.shop.example/", status: 302 },
      ],
      finalUrl: "https://www.shop.example/home",
      robotsTxt: null,
      sitemap: { status: 404, body: "Not found" },
    }),
    { localChecks: false },
  );

  it("fails exactly the expected checks", () => {
    expect(failedIds(result.issues)).toEqual(
      [
        "seo.title.missing",
        "seo.meta-description.missing",
        "seo.h1.multiple",
        "seo.headings.skipped-level",
        "seo.canonical.missing",
        "seo.viewport.missing",
        "seo.open-graph.incomplete",
        "seo.noindex",
        "technical.status.error",
        "technical.redirects.too-many",
        "technical.mixed-content",
        "technical.headers.hsts.missing",
        "technical.headers.csp.missing",
        "technical.headers.frame-options.missing",
        "technical.headers.content-type-options.missing",
        "technical.favicon.missing",
        "technical.robots-txt.missing",
        "technical.sitemap.missing",
        "accessibility.img-alt.missing",
        "accessibility.form-label.missing",
        "accessibility.link-name.missing",
        "accessibility.button-name.missing",
        "accessibility.lang.missing",
      ].sort(),
    );
  });

  it("fills in evidence on every failed issue", () => {
    for (const issue of result.issues.filter((candidate) => !candidate.passed)) {
      expect(issue.evidence, issue.id).toBeDefined();
    }
  });
});

describe("every issue", () => {
  const all = [
    ...runHtmlChecks(snapshot(fixture("good.html")), { localChecks: true }).issues,
    ...runHtmlChecks(snapshot(fixture("bad.html")), { localChecks: true }).issues,
  ];

  it("matches the Issue schema", () => {
    for (const issue of all) expect(issueSchema.safeParse(issue).success, issue.id).toBe(true);
  });

  it("uses a registered id with the registered category and severity", () => {
    for (const issue of all) {
      const definition = checkRegistry[issue.id as keyof typeof checkRegistry];
      expect(definition, issue.id).toBeDefined();
      expect(issue.category).toBe(definition.category);
      expect(issue.severity).toBe(definition.severity);
    }
  });

  it("keeps evidence strings short", () => {
    const longest = Math.max(
      ...all.flatMap((issue) =>
        JSON.stringify(issue.evidence ?? {})
          .split('"')
          .map((part) => [...part].length),
      ),
    );
    expect(longest).toBeLessThanOrEqual(301);
  });
});

describe("local business opt-in", () => {
  it("adds local checks only when opted in, all tagged local", () => {
    const html = fixture("local-pass.html");
    const without = runHtmlChecks(snapshot(html), { localChecks: false }).issues;
    const withLocal = runHtmlChecks(snapshot(html), { localChecks: true }).issues;

    expect(without.some((issue) => issue.id.startsWith("local."))).toBe(false);
    const local = withLocal.filter((issue) => issue.id.startsWith("local."));
    expect(local.map((issue) => issue.id).sort()).toEqual([...localIds].sort());
    expect(local.every((issue) => issue.tags?.includes("local"))).toBe(true);
  });
});
