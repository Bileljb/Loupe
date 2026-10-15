import type { Issue } from "@/lib/schemas";
import { charLength, collapseWhitespace, truncate, type ParsedPage } from "./page";
import { makeIssue } from "./registry";

export const TITLE_MIN = 10;
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 50;
export const DESCRIPTION_MAX = 160;

function metaContent({ $ }: ParsedPage, selector: string): string {
  return collapseWhitespace($(selector).first().attr("content") ?? "");
}

function titleChecks(page: ParsedPage): Issue[] {
  const title = collapseWhitespace(page.$("title").first().text());
  if (!title) return [makeIssue("seo.title.missing", false, { title: null })];

  const length = charLength(title);
  const evidence = { title: truncate(title), length };
  return [
    makeIssue("seo.title.missing", true, { title: truncate(title) }),
    makeIssue("seo.title.too-short", length >= TITLE_MIN, { ...evidence, min: TITLE_MIN }),
    makeIssue("seo.title.too-long", length <= TITLE_MAX, { ...evidence, max: TITLE_MAX }),
  ];
}

function descriptionChecks(page: ParsedPage): Issue[] {
  const description = metaContent(page, 'meta[name="description" i]');
  if (!description) return [makeIssue("seo.meta-description.missing", false, { description: null })];

  const length = charLength(description);
  const evidence = { description: truncate(description), length };
  return [
    makeIssue("seo.meta-description.missing", true, { description: truncate(description) }),
    makeIssue("seo.meta-description.too-short", length >= DESCRIPTION_MIN, { ...evidence, min: DESCRIPTION_MIN }),
    makeIssue("seo.meta-description.too-long", length <= DESCRIPTION_MAX, { ...evidence, max: DESCRIPTION_MAX }),
  ];
}

function headingChecks({ $ }: ParsedPage): Issue[] {
  const h1s = $("h1")
    .toArray()
    .map((el) => collapseWhitespace($(el).text()))
    .filter(Boolean);
  const h1Evidence = { count: h1s.length, h1: h1s.slice(0, 5).map((text) => truncate(text, 120)) };

  const issues = [makeIssue("seo.h1.missing", h1s.length > 0, h1Evidence)];
  if (h1s.length > 0) issues.push(makeIssue("seo.h1.multiple", h1s.length === 1, h1Evidence));

  // A heading may go any number of levels up, but only one level down (h2 -> h4 skips h3).
  let previous: number | undefined;
  let skip: { from: string; to: string; text: string } | undefined;
  for (const el of $("h1, h2, h3, h4, h5, h6").toArray()) {
    const level = Number(el.tagName.slice(1));
    if (previous !== undefined && level > previous + 1 && !skip) {
      skip = { from: `h${previous}`, to: `h${level}`, text: truncate(collapseWhitespace($(el).text()), 120) };
    }
    previous = level;
  }
  issues.push(makeIssue("seo.headings.skipped-level", !skip, skip));
  return issues;
}

function noindexCheck(page: ParsedPage): Issue {
  const sources: string[] = [];
  page.$('meta[name="robots" i], meta[name="googlebot" i]').each((_, el) => {
    const content = page.$(el).attr("content") ?? "";
    if (/\b(noindex|none)\b/i.test(content)) sources.push(`meta: ${truncate(content, 120)}`);
  });
  const header = page.headers["x-robots-tag"];
  if (header && /\b(noindex|none)\b/i.test(header)) sources.push(`X-Robots-Tag: ${truncate(header, 120)}`);
  return makeIssue("seo.noindex", sources.length === 0, { sources });
}

export function seoChecks(page: ParsedPage): Issue[] {
  const { $ } = page;
  const canonical = $('link[rel~="canonical" i][href]').first().attr("href");
  const viewport = metaContent(page, 'meta[name="viewport" i]');
  const openGraph = ["og:title", "og:description", "og:image"] as const;
  const missingOpenGraph = openGraph.filter((property) => !metaContent(page, `meta[property="${property}"]`));

  return [
    ...titleChecks(page),
    ...descriptionChecks(page),
    ...headingChecks(page),
    makeIssue("seo.canonical.missing", Boolean(canonical), { canonical: canonical ? truncate(canonical) : null }),
    // Same rule as Lighthouse: either width or initial-scale makes the page fit phones.
    makeIssue("seo.viewport.missing", /\b(width|initial-scale)\s*=/i.test(viewport), {
      viewport: viewport ? truncate(viewport) : null,
    }),
    makeIssue("seo.open-graph.incomplete", missingOpenGraph.length === 0, { missing: missingOpenGraph }),
    noindexCheck(page),
  ];
}
