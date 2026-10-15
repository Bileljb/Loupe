import { load, type CheerioAPI } from "cheerio";
import type { Confidence, Platform } from "@/lib/schemas";

type Signal = {
  strength: "strong" | "weak";
  test: (input: { html: string; $: CheerioAPI; headers: Record<string, string> }) => boolean;
};

const generator = (pattern: RegExp): Signal["test"] => ({ $ }) =>
  $('meta[name="generator" i]')
    .toArray()
    .some((el) => pattern.test($(el).attr("content") ?? ""));

const htmlContains = (needle: string): Signal["test"] => ({ html }) => html.includes(needle);

const header = (name: string, pattern?: RegExp): Signal["test"] => ({ headers }) => {
  const value = headers[name];
  return value !== undefined && (!pattern || pattern.test(value));
};

const SIGNALS: Record<Exclude<Platform, "unknown">, Signal[]> = {
  wordpress: [
    { strength: "strong", test: generator(/^wordpress/i) },
    { strength: "strong", test: htmlContains("/wp-content/") },
    { strength: "strong", test: htmlContains("/wp-includes/") },
    { strength: "strong", test: header("link", /api\.w\.org/i) },
    { strength: "weak", test: htmlContains("wp-json") },
  ],
  wix: [
    { strength: "strong", test: htmlContains("static.wixstatic.com") },
    { strength: "strong", test: htmlContains("static.parastorage.com") },
    { strength: "strong", test: generator(/wix\.com/i) },
    { strength: "strong", test: header("x-wix-request-id") },
  ],
  shopify: [
    { strength: "strong", test: htmlContains("cdn.shopify.com") },
    { strength: "strong", test: htmlContains("Shopify.theme") },
    { strength: "strong", test: header("x-shopid") },
    { strength: "strong", test: header("x-shopify-stage") },
    { strength: "weak", test: htmlContains("myshopify.com") },
  ],
  squarespace: [
    { strength: "strong", test: htmlContains("static1.squarespace.com") },
    { strength: "strong", test: htmlContains("This is Squarespace.") },
    { strength: "strong", test: header("server", /squarespace/i) },
    { strength: "weak", test: htmlContains("squarespace-cdn.com") },
  ],
  webflow: [
    { strength: "strong", test: ({ $ }) => $("html[data-wf-site], html[data-wf-page]").length > 0 },
    { strength: "strong", test: generator(/^webflow/i) },
    { strength: "weak", test: htmlContains("website-files.com") },
  ],
};

export type PlatformDetection = { name: Platform; confidence: Confidence };

/** Best guess from several signals per platform. The UI must word this as a guess ("looks like"). */
export function detectPlatform(
  html: string,
  headers: Record<string, string>,
  $: CheerioAPI = load(html),
): PlatformDetection {
  let best: { name: Platform; strong: number; weak: number } = { name: "unknown", strong: 0, weak: 0 };

  for (const [name, signals] of Object.entries(SIGNALS) as [Exclude<Platform, "unknown">, Signal[]][]) {
    const matched = signals.filter((signal) => signal.test({ html, $, headers }));
    const strong = matched.filter((signal) => signal.strength === "strong").length;
    const weak = matched.length - strong;
    if (strong > best.strong || (strong === best.strong && weak > best.weak)) best = { name, strong, weak };
  }

  if (best.name === "unknown" || best.strong + best.weak === 0) return { name: "unknown", confidence: "low" };
  const confidence: Confidence = best.strong >= 2 ? "high" : best.strong === 1 ? "medium" : "low";
  return { name: best.name, confidence };
}
