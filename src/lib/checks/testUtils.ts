import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Issue } from "@/lib/schemas";
import { parsePage, type PageSnapshot, type ParsedPage } from "./page";

// Test-only helpers. Not imported by application code.

export function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__", name), "utf8");
}

export const secureHeaders: Record<string, string> = {
  "content-type": "text/html; charset=utf-8",
  "strict-transport-security": "max-age=31536000; includeSubDomains",
  "content-security-policy": "default-src 'self'",
  "x-frame-options": "SAMEORIGIN",
  "x-content-type-options": "nosniff",
};

export function snapshot(html: string, overrides: Partial<PageSnapshot> = {}): PageSnapshot {
  return {
    finalUrl: "https://rosas-bakery.example/",
    status: 200,
    headers: secureHeaders,
    redirects: [],
    html,
    robotsTxt: { status: 200, body: "User-agent: *\nAllow: /\n" },
    sitemap: { status: 200, body: '<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>' },
    ...overrides,
  };
}

export function page(html: string, overrides: Partial<PageSnapshot> = {}): ParsedPage {
  return parsePage(snapshot(html, overrides));
}

export function find(issues: Issue[], id: string): Issue {
  const issue = issues.find((candidate) => candidate.id === id);
  if (!issue) throw new Error(`No issue with id ${id}. Got: ${issues.map((i) => i.id).join(", ")}`);
  return issue;
}

export function failedIds(issues: Issue[]): string[] {
  return issues.filter((issue) => !issue.passed).map((issue) => issue.id).sort();
}
