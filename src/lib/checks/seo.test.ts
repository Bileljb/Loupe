import { describe, expect, it } from "vitest";
import { seoChecks } from "./seo";
import { find, page } from "./testUtils";

const run = (head: string, body = "", headers?: Record<string, string>) =>
  seoChecks(page(`<html><head>${head}</head><body>${body}</body></html>`, headers ? { headers } : {}));

describe("title", () => {
  it("reports a missing title and skips the length checks", () => {
    const issues = run("");
    expect(find(issues, "seo.title.missing")).toMatchObject({ passed: false, evidence: { title: null } });
    expect(issues.some((issue) => issue.id === "seo.title.too-short")).toBe(false);
  });

  it("treats a whitespace-only title as missing", () => {
    expect(find(run("<title>   </title>"), "seo.title.missing").passed).toBe(false);
  });

  it("flags short and long titles with their length", () => {
    expect(find(run("<title>Home</title>"), "seo.title.too-short")).toMatchObject({
      passed: false,
      evidence: { title: "Home", length: 4 },
    });
    const long = "A".repeat(61);
    expect(find(run(`<title>${long}</title>`), "seo.title.too-long")).toMatchObject({
      passed: false,
      evidence: { length: 61 },
    });
    expect(find(run(`<title>${"A".repeat(60)}</title>`), "seo.title.too-long").passed).toBe(true);
  });

  it("counts characters, not bytes, for accented and Arabic titles", () => {
    const arabic = "مخبز روزا في تونس العاصمة";
    expect(find(run(`<title>${arabic}</title>`), "seo.title.too-short")).toMatchObject({
      passed: true,
      evidence: { length: [...arabic].length },
    });
  });
});

describe("meta description", () => {
  it("matches the name attribute case-insensitively", () => {
    const description = "A".repeat(80);
    expect(find(run(`<meta name="Description" content="${description}">`), "seo.meta-description.missing").passed).toBe(true);
  });

  it("flags missing, short and long descriptions", () => {
    expect(find(run(""), "seo.meta-description.missing").passed).toBe(false);
    expect(find(run('<meta name="description" content="Too short">'), "seo.meta-description.too-short").passed).toBe(false);
    expect(
      find(run(`<meta name="description" content="${"A".repeat(161)}">`), "seo.meta-description.too-long").passed,
    ).toBe(false);
  });
});

describe("headings", () => {
  it("flags a missing H1 and skips the multiple-H1 check", () => {
    const issues = run("", "<h2>Hello</h2>");
    expect(find(issues, "seo.h1.missing").passed).toBe(false);
    expect(issues.some((issue) => issue.id === "seo.h1.multiple")).toBe(false);
  });

  it("ignores empty H1 elements", () => {
    expect(find(run("", "<h1> </h1><h1>Real</h1>"), "seo.h1.multiple").passed).toBe(true);
  });

  it("flags multiple H1s with their text", () => {
    expect(find(run("", "<h1>One</h1><h1>Two</h1>"), "seo.h1.multiple")).toMatchObject({
      passed: false,
      evidence: { count: 2, h1: ["One", "Two"] },
    });
  });

  it("flags skipping a level going down, but not going back up", () => {
    expect(find(run("", "<h1>A</h1><h3>B</h3>"), "seo.headings.skipped-level")).toMatchObject({
      passed: false,
      evidence: { from: "h1", to: "h3", text: "B" },
    });
    expect(find(run("", "<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2><h3>E</h3>"), "seo.headings.skipped-level").passed).toBe(true);
    expect(find(run("", "<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h2>E</h2>"), "seo.headings.skipped-level").passed).toBe(true);
  });
});

describe("canonical, viewport, Open Graph", () => {
  it("finds a canonical link", () => {
    expect(find(run('<link rel="canonical" href="https://a.example/">'), "seo.canonical.missing")).toMatchObject({
      passed: true,
      evidence: { canonical: "https://a.example/" },
    });
    expect(find(run('<link rel="canonical">'), "seo.canonical.missing").passed).toBe(false);
  });

  it("requires width or initial-scale in the viewport, like Lighthouse", () => {
    expect(find(run('<meta name="viewport" content="width=device-width">'), "seo.viewport.missing").passed).toBe(true);
    expect(find(run('<meta name="viewport" content="initial-scale=1,user-scalable=yes">'), "seo.viewport.missing").passed).toBe(true);
    expect(find(run('<meta name="viewport" content="user-scalable=no">'), "seo.viewport.missing").passed).toBe(false);
    expect(find(run(""), "seo.viewport.missing")).toMatchObject({ passed: false, evidence: { viewport: null } });
  });

  it("lists the missing Open Graph tags", () => {
    expect(find(run('<meta property="og:title" content="Hi">'), "seo.open-graph.incomplete")).toMatchObject({
      passed: false,
      evidence: { missing: ["og:description", "og:image"] },
    });
  });
});

describe("noindex", () => {
  it("detects noindex and none in robots meta tags", () => {
    expect(find(run('<meta name="robots" content="noindex">'), "seo.noindex").passed).toBe(false);
    expect(find(run('<meta name="ROBOTS" content="none">'), "seo.noindex").passed).toBe(false);
    expect(find(run('<meta name="googlebot" content="noindex,nofollow">'), "seo.noindex").passed).toBe(false);
    expect(find(run('<meta name="robots" content="index, follow">'), "seo.noindex").passed).toBe(true);
  });

  it("detects noindex in the X-Robots-Tag header", () => {
    expect(find(run("", "", { "x-robots-tag": "noindex" }), "seo.noindex")).toMatchObject({
      passed: false,
      evidence: { sources: ["X-Robots-Tag: noindex"] },
    });
  });
});
