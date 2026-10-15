import { load, type Cheerio, type CheerioAPI, type contains } from "cheerio";

/** Result of fetching robots.txt or sitemap.xml; null when the fetch failed or was refused. */
export type SiteFile = { status: number; body: string } | null;

/** Everything the checks need, as plain data. Built by the orchestrator; checks never fetch. */
export type PageSnapshot = {
  finalUrl: string;
  status: number;
  headers: Record<string, string>; // lowercase names
  redirects: { url: string; status: number }[];
  html: string;
  robotsTxt: SiteFile;
  sitemap: SiteFile;
};

export type ParsedPage = PageSnapshot & { url: URL; $: CheerioAPI };

// Cheerio doesn't re-export its node types; derive one from a public signature.
type AnyNode = Parameters<typeof contains>[1];
export type Selection = Cheerio<AnyNode>;

/** Parses the HTML once so every check shares the same tree. */
export function parsePage(snapshot: PageSnapshot): ParsedPage {
  return { ...snapshot, url: new URL(snapshot.finalUrl), $: load(snapshot.html) };
}

const MAX_EVIDENCE_LENGTH = 300;
export const MAX_EVIDENCE_ITEMS = 5;

/** Evidence comes from untrusted pages; keep it short so stored reports stay small. */
export function truncate(value: string, max = MAX_EVIDENCE_LENGTH): string {
  const chars = [...value];
  return chars.length > max ? `${chars.slice(0, max).join("")}…` : value;
}

export function collapseWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

/** Length in characters as people count them (code points, not UTF-16 units). */
export function charLength(value: string): number {
  return [...value].length;
}

export function isSuccess(status: number): boolean {
  return status >= 200 && status < 300;
}
