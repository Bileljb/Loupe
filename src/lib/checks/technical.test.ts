import { describe, expect, it } from "vitest";
import { technicalChecks } from "./technical";
import { find, page, secureHeaders } from "./testUtils";

const html = (body = "", head = "") => `<html><head>${head}</head><body>${body}</body></html>`;

describe("HTTPS, status and redirects", () => {
  it("flags a page served over HTTP and skips HTTPS-only checks", () => {
    const issues = technicalChecks(page(html('<img src="http://a.example/x.png">'), { finalUrl: "http://shop.example/" }));
    expect(find(issues, "technical.https.missing").passed).toBe(false);
    expect(issues.some((issue) => issue.id === "technical.mixed-content")).toBe(false);
    expect(issues.some((issue) => issue.id === "technical.headers.hsts.missing")).toBe(false);
  });

  it("flags non-2xx final status codes", () => {
    expect(find(technicalChecks(page(html(), { status: 404 })), "technical.status.error")).toMatchObject({
      passed: false,
      evidence: { status: 404 },
    });
    expect(find(technicalChecks(page(html(), { status: 204 })), "technical.status.error").passed).toBe(true);
  });

  it("allows two redirects but flags three", () => {
    const hops = (count: number) =>
      Array.from({ length: count }, (_, i) => ({ url: `https://a.example/${i}`, status: 301 }));
    expect(find(technicalChecks(page(html(), { redirects: hops(2) })), "technical.redirects.too-many").passed).toBe(true);
    expect(find(technicalChecks(page(html(), { redirects: hops(3) })), "technical.redirects.too-many")).toMatchObject({
      passed: false,
      evidence: { count: 3 },
    });
  });
});

describe("mixed content", () => {
  it("lists insecure resources on an HTTPS page", () => {
    const body = '<img src="http://a.example/1.png"><script src="HTTP://a.example/2.js"></script><iframe src="https://ok.example/"></iframe>';
    const head = '<link rel="stylesheet" href="http://a.example/3.css">';
    expect(find(technicalChecks(page(html(body, head))), "technical.mixed-content")).toMatchObject({
      passed: false,
      evidence: { count: 3 },
    });
  });

  it("ignores ordinary http links, which are not loaded resources", () => {
    expect(find(technicalChecks(page(html('<a href="http://a.example/">x</a>'))), "technical.mixed-content").passed).toBe(true);
  });
});

describe("security headers", () => {
  it("passes when all headers are present", () => {
    const issues = technicalChecks(page(html()));
    for (const id of [
      "technical.headers.hsts.missing",
      "technical.headers.csp.missing",
      "technical.headers.frame-options.missing",
      "technical.headers.content-type-options.missing",
    ]) {
      expect(find(issues, id).passed, id).toBe(true);
    }
  });

  it("accepts CSP frame-ancestors instead of X-Frame-Options", () => {
    const headers = { "content-security-policy": "frame-ancestors 'self'" };
    expect(find(technicalChecks(page(html(), { headers })), "technical.headers.frame-options.missing")).toMatchObject({
      passed: true,
      evidence: { cspFrameAncestors: true },
    });
  });

  it("requires X-Content-Type-Options to be nosniff", () => {
    const headers = { ...secureHeaders, "x-content-type-options": "sniff" };
    expect(find(technicalChecks(page(html(), { headers })), "technical.headers.content-type-options.missing").passed).toBe(false);
  });
});

describe("favicon", () => {
  it.each(['<link rel="icon" href="/f.png">', '<link rel="shortcut icon" href="/f.ico">', '<link rel="apple-touch-icon" href="/a.png">'])(
    "finds %s",
    (head) => {
      expect(find(technicalChecks(page(html("", head))), "technical.favicon.missing").passed).toBe(true);
    },
  );
});

describe("robots.txt and sitemap", () => {
  it("treats failed, error and empty robots.txt as missing", () => {
    for (const robotsTxt of [null, { status: 404, body: "" }, { status: 200, body: "  " }]) {
      expect(find(technicalChecks(page(html(), { robotsTxt })), "technical.robots-txt.missing").passed).toBe(false);
    }
  });

  it("accepts a sitemap index", () => {
    const sitemap = { status: 200, body: "<sitemapindex><sitemap></sitemap></sitemapindex>" };
    expect(find(technicalChecks(page(html(), { sitemap })), "technical.sitemap.missing").passed).toBe(true);
  });

  it("rejects a 200 response that isn't a sitemap", () => {
    const sitemap = { status: 200, body: "<html>Not found</html>" };
    expect(find(technicalChecks(page(html(), { sitemap })), "technical.sitemap.missing").passed).toBe(false);
  });

  it("accepts a sitemap declared in robots.txt even when /sitemap.xml is missing", () => {
    const robotsTxt = { status: 200, body: "User-agent: *\nSitemap: https://a.example/sitemap_index.xml\n" };
    expect(
      find(technicalChecks(page(html(), { robotsTxt, sitemap: { status: 404, body: "" } })), "technical.sitemap.missing"),
    ).toMatchObject({ passed: true, evidence: { declaredInRobotsTxt: ["https://a.example/sitemap_index.xml"] } });
  });
});
