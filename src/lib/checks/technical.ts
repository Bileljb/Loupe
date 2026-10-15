import type { Issue } from "@/lib/schemas";
import { isSuccess, MAX_EVIDENCE_ITEMS, truncate, type ParsedPage } from "./page";
import { makeIssue } from "./registry";

export const MAX_HEALTHY_REDIRECTS = 2;

// Elements whose http:// resources are blocked or flagged on an https page.
const RESOURCE_SELECTORS = [
  ["img[src]", "src"],
  ["script[src]", "src"],
  ["iframe[src]", "src"],
  ["video[src], audio[src], source[src], track[src], embed[src]", "src"],
  ["object[data]", "data"],
  ['link[rel~="stylesheet" i][href]', "href"],
] as const;

function mixedContent({ $ }: ParsedPage): string[] {
  const insecure: string[] = [];
  for (const [selector, attribute] of RESOURCE_SELECTORS) {
    $(selector).each((_, el) => {
      const value = $(el).attr(attribute)?.trim() ?? "";
      if (/^http:\/\//i.test(value)) insecure.push(value);
    });
  }
  return insecure;
}

function headerChecks(page: ParsedPage, isHttps: boolean): Issue[] {
  const { headers } = page;
  const csp = headers["content-security-policy"];
  const frameOptions = headers["x-frame-options"];
  const contentTypeOptions = headers["x-content-type-options"];
  const cspHasFrameAncestors = Boolean(csp && /frame-ancestors/i.test(csp));
  const issues: Issue[] = [];

  // HSTS only means something over HTTPS; on HTTP the HTTPS issue already covers it.
  if (isHttps) {
    const hsts = headers["strict-transport-security"];
    issues.push(makeIssue("technical.headers.hsts.missing", Boolean(hsts), { value: hsts ? truncate(hsts) : null }));
  }
  issues.push(
    makeIssue("technical.headers.csp.missing", Boolean(csp), { value: csp ? truncate(csp) : null }),
    makeIssue("technical.headers.frame-options.missing", Boolean(frameOptions) || cspHasFrameAncestors, {
      value: frameOptions ? truncate(frameOptions) : null,
      cspFrameAncestors: cspHasFrameAncestors,
    }),
    makeIssue("technical.headers.content-type-options.missing", contentTypeOptions?.trim().toLowerCase() === "nosniff", {
      value: contentTypeOptions ? truncate(contentTypeOptions) : null,
    }),
  );
  return issues;
}

function siteFileChecks(page: ParsedPage): Issue[] {
  const robots = page.robotsTxt;
  const robotsFound = robots !== null && isSuccess(robots.status) && robots.body.trim().length > 0;

  const declaredSitemaps = robotsFound
    ? [...robots.body.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((match) => match[1] ?? "").filter(Boolean)
    : [];
  const sitemap = page.sitemap;
  const sitemapFound =
    sitemap !== null && isSuccess(sitemap.status) && /<(urlset|sitemapindex)[\s>]/i.test(sitemap.body);

  return [
    makeIssue("technical.robots-txt.missing", robotsFound, robots ? { status: robots.status } : { fetched: false }),
    makeIssue("technical.sitemap.missing", sitemapFound || declaredSitemaps.length > 0, {
      ...(sitemap ? { status: sitemap.status } : { fetched: false }),
      ...(declaredSitemaps.length ? { declaredInRobotsTxt: declaredSitemaps.slice(0, MAX_EVIDENCE_ITEMS).map((u) => truncate(u)) } : {}),
    }),
  ];
}

export function technicalChecks(page: ParsedPage): Issue[] {
  const isHttps = page.url.protocol === "https:";
  const insecure = isHttps ? mixedContent(page) : [];
  const favicon = page.$('link[rel~="icon" i][href], link[rel~="apple-touch-icon" i][href]').first().attr("href");

  return [
    makeIssue("technical.https.missing", isHttps, { finalUrl: truncate(page.finalUrl) }),
    makeIssue("technical.status.error", isSuccess(page.status), { status: page.status }),
    makeIssue("technical.redirects.too-many", page.redirects.length <= MAX_HEALTHY_REDIRECTS, {
      count: page.redirects.length,
      chain: [...page.redirects.map((hop) => truncate(hop.url)), truncate(page.finalUrl)],
    }),
    ...(isHttps
      ? [
          makeIssue("technical.mixed-content", insecure.length === 0, {
            count: insecure.length,
            examples: insecure.slice(0, MAX_EVIDENCE_ITEMS).map((u) => truncate(u)),
          }),
        ]
      : []),
    ...headerChecks(page, isHttps),
    makeIssue("technical.favicon.missing", Boolean(favicon), { href: favicon ? truncate(favicon) : null }),
    ...siteFileChecks(page),
  ];
}
