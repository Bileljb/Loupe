import { describe, expect, it } from "vitest";
import { checkIds } from "@/lib/checks/registry";
import { routing } from "@/i18n/routing";
import { FALLBACK_ID, getKbEntry, kbByLocale } from "./index";
import { shared } from "./shared";
import type { KbText, KnownPlatform } from "./types";

const LAYER_1_FIELDS = ["title", "what", "why", "businessImpact", "fix"] as const satisfies readonly (keyof KbText)[];
const PLATFORMS: KnownPlatform[] = ["wordpress", "wix", "shopify", "squarespace", "webflow"];

// Terms owners shouldn't have to know. Technical detail belongs in snippets and evidence (Layer 2).
const BANNED_EVERYWHERE = [
  "LCP", "CLS", "TBT", "INP", "FCP", "TTFB", "canonical", "hreflang", "CSP", "HSTS", "DOM",
  "render-blocking", "JSON-LD", "schema markup", "HTTP header", "X-Frame-Options", "nosniff",
  "viewport", "H1", "Open Graph", "meta description", "meta tag", "JavaScript", "CSS", "minify",
  "gzip", "brotli", "CDN", "cache-control", "DNS",
];
const BANNED_BY_LOCALE: Record<string, string[]> = {
  en: ["tag", "attribute", "header"],
  fr: ["balise", "attribut", "en-tête", "métadonnée"],
  ar: ["وسم", "سمة", "ترويسة"],
};

function bannedTermsIn(text: string, locale: string): string[] {
  const latin = [...BANNED_EVERYWHERE, ...(locale === "ar" ? [] : (BANNED_BY_LOCALE[locale] ?? []))].filter((term) =>
    new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}])`, "iu").test(text),
  );
  const arabic = locale === "ar" ? (BANNED_BY_LOCALE.ar ?? []).filter((term) => text.includes(term)) : [];
  return [...latin, ...arabic];
}

describe("knowledge base coverage", () => {
  it.each(routing.locales)("%s has an entry for every check id, and nothing else", (locale) => {
    expect(Object.keys(kbByLocale[locale]).sort()).toEqual([...checkIds].sort());
  });

  it("has shared fields for every check id", () => {
    expect(Object.keys(shared).sort()).toEqual([...checkIds].sort());
  });

  it.each(routing.locales)("%s fills in every Layer 1 field, including business impact", (locale) => {
    for (const id of checkIds) {
      for (const field of LAYER_1_FIELDS) {
        expect(kbByLocale[locale][id][field].trim().length, `${locale} ${id}.${field}`).toBeGreaterThan(10);
      }
    }
  });

  it("gives every locale platform fixes for the same checks and platforms", () => {
    const shape = (locale: (typeof routing.locales)[number]) =>
      checkIds
        .filter((id) => kbByLocale[locale][id].platformFixes)
        .map((id) => `${id}:${Object.keys(kbByLocale[locale][id].platformFixes ?? {}).sort().join(",")}`);
    for (const locale of routing.locales) expect(shape(locale)).toEqual(shape("en"));
  });

  it.each([
    "seo.title.missing",
    "seo.meta-description.missing",
    "accessibility.img-alt.missing",
    "performance.images.unoptimized",
    "technical.https.missing",
    "technical.sitemap.missing",
  ] as const)("has platform fixes for all five platforms on %s", (id) => {
    for (const locale of routing.locales) {
      expect(Object.keys(kbByLocale[locale][id].platformFixes ?? {}).sort(), `${locale} ${id}`).toEqual([...PLATFORMS].sort());
    }
  });
});

describe("jargon test", () => {
  it("catches banned terms (self-check)", () => {
    expect(bannedTermsIn("Your LCP is slow", "en")).toEqual(["LCP"]);
    expect(bannedTermsIn("Ajoutez une balise", "fr")).toEqual(["balise"]);
    expect(bannedTermsIn("أضف وسم العنوان", "ar")).toEqual(["وسم"]);
    // Word boundaries: "domaine" must not match "DOM", "Heading 1" must not match "H1".
    expect(bannedTermsIn("votre domaine, Heading 1, attributes", "fr")).toEqual([]);
  });

  it.each(routing.locales)("%s Layer 1 text uses no jargon", (locale) => {
    const offences: string[] = [];
    for (const id of checkIds) {
      for (const field of LAYER_1_FIELDS) {
        const terms = bannedTermsIn(kbByLocale[locale][id][field], locale);
        if (terms.length) offences.push(`${id}.${field}: ${terms.join(", ")}`);
      }
    }
    expect(offences).toEqual([]);
  });

  it.each(routing.locales)("%s uses Western digits only", (locale) => {
    const text = JSON.stringify(kbByLocale[locale]);
    expect(text).not.toMatch(/[٠-٩۰-۹]/);
  });
});

describe("getKbEntry", () => {
  it("merges translated text with shared effort, impact and snippet", () => {
    const entry = getKbEntry("fr", "seo.title.missing");
    expect(entry.title).toBe(kbByLocale.fr["seo.title.missing"].title);
    expect(entry).toMatchObject({ effort: "low", impact: "high", isFallback: false });
    expect(entry.snippet).toBe(getKbEntry("ar", "seo.title.missing").snippet);
  });

  it("adds the platform fix next to the generic fix, never instead of it", () => {
    for (const locale of routing.locales) {
      for (const id of checkIds) {
        for (const platform of PLATFORMS) {
          const entry = getKbEntry(locale, id, platform);
          expect(entry.fix, `${locale} ${id} ${platform}`).toBe(kbByLocale[locale][id].fix);
          if (entry.platformFix) expect(entry.platformFix).not.toBe(entry.fix);
        }
      }
    }
  });

  it("gives the platform fix for a known platform only", () => {
    expect(getKbEntry("en", "seo.title.missing", "shopify").platformFix).toContain("Online Store");
    expect(getKbEntry("en", "seo.title.missing", "unknown").platformFix).toBeUndefined();
    expect(getKbEntry("en", "seo.title.missing").platformFix).toBeUndefined();
    expect(getKbEntry("en", "seo.h1.missing", "wix").platformFix).toBeUndefined();
  });

  it("falls back for unknown ids and keeps the original id", () => {
    const entry = getKbEntry("ar", "psi.some-new-audit");
    expect(entry).toMatchObject({ id: "psi.some-new-audit", isFallback: true });
    expect(entry.title).toBe(kbByLocale.ar[FALLBACK_ID].title);
  });

  it("is not fooled by inherited object keys", () => {
    expect(getKbEntry("en", "toString").isFallback).toBe(true);
    expect(getKbEntry("en", "__proto__").isFallback).toBe(true);
  });
});
