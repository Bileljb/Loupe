import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { alternates, clip, indexablePaths, localeUrl, pageMetadata } from "./seo";

describe("alternates", () => {
  it("has a self canonical and hreflang for every locale plus x-default", () => {
    const result = alternates("fr", "/guides/missing-sitemap");
    expect(result.canonical).toBe(localeUrl("fr", "/guides/missing-sitemap"));
    expect(Object.keys(result.languages ?? {}).sort()).toEqual(["ar", "en", "fr", "x-default"]);
    expect((result.languages as Record<string, string>)["x-default"]).toBe(localeUrl("en", "/guides/missing-sitemap"));
  });

  it("builds clean locale URLs", () => {
    expect(localeUrl("ar", "/")).toMatch(/\/ar$/);
    expect(localeUrl("en", "/guides")).toMatch(/\/en\/guides$/);
  });
});

describe("pageMetadata", () => {
  it("sets social cards in full and the template unless told otherwise", () => {
    const metadata = pageMetadata({ locale: "en", path: "/guides", title: "Guides", description: "All guides" });
    expect(metadata.title).toBe("Guides");
    expect(metadata.openGraph).toMatchObject({ title: "Guides", locale: "en_US", alternateLocale: ["fr_FR", "ar_AR"] });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(pageMetadata({ locale: "en", path: "/", title: "Loupe", description: "x", absoluteTitle: true }).title).toEqual({ absolute: "Loupe" });
  });
});

describe("clip", () => {
  it("keeps short text and trims long text at a word boundary", () => {
    expect(clip("Short text.")).toBe("Short text.");
    const long = "word ".repeat(60);
    const clipped = clip(long);
    expect(clipped.length).toBeLessThanOrEqual(155);
    expect(clipped.endsWith("word…")).toBe(true);
  });
});

describe("sitemap and robots", () => {
  const entries = sitemap();

  it("lists every indexable page in every language and nothing else", () => {
    expect(entries).toHaveLength(indexablePaths().length * 3);
    expect(entries.some((entry) => entry.url.includes("/report/"))).toBe(false);
    expect(entries.every((entry) => Object.keys(entry.alternates?.languages ?? {}).length === 4)).toBe(true);
  });

  it("blocks the API and report pages in every language", () => {
    const rules = robots().rules;
    const disallow = Array.isArray(rules) ? rules.flatMap((rule) => rule.disallow ?? []) : rules.disallow;
    expect(disallow).toEqual(["/api/", "/en/report/", "/fr/report/", "/ar/report/"]);
    expect(robots().sitemap).toMatch(/\/sitemap\.xml$/);
  });
});
