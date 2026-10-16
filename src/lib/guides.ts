import { checkRegistry, type CheckId } from "@/lib/checks/registry";
import type { Category } from "@/lib/schemas";

/**
 * One static guide per check. Slugs are English in every language (URLs are not translated)
 * and must never change once published: they are linked from reports and search results.
 * The PSI fallback (`performance.other`) has no guide: it isn't one specific problem.
 */
export const guideSlugs = {
  "seo.title.missing": "missing-page-title",
  "seo.title.too-short": "page-title-too-short",
  "seo.title.too-long": "page-title-too-long",
  "seo.meta-description.missing": "missing-meta-description",
  "seo.meta-description.too-short": "meta-description-too-short",
  "seo.meta-description.too-long": "meta-description-too-long",
  "seo.h1.missing": "missing-main-heading",
  "seo.h1.multiple": "multiple-main-headings",
  "seo.headings.skipped-level": "skipped-heading-levels",
  "seo.canonical.missing": "missing-canonical-link",
  "seo.viewport.missing": "page-not-mobile-friendly",
  "seo.open-graph.incomplete": "missing-social-sharing-preview",
  "seo.noindex": "page-hidden-from-google",
  "technical.https.missing": "website-not-secure-https",
  "technical.status.error": "homepage-returns-an-error",
  "technical.redirects.too-many": "too-many-redirects",
  "technical.mixed-content": "mixed-content-warning",
  "technical.headers.hsts.missing": "missing-hsts-header",
  "technical.headers.csp.missing": "missing-content-security-policy",
  "technical.headers.frame-options.missing": "missing-clickjacking-protection",
  "technical.headers.content-type-options.missing": "missing-nosniff-header",
  "technical.favicon.missing": "missing-favicon",
  "technical.robots-txt.missing": "missing-robots-txt",
  "technical.sitemap.missing": "missing-sitemap",
  "accessibility.img-alt.missing": "images-missing-alt-text",
  "accessibility.form-label.missing": "form-fields-missing-labels",
  "accessibility.link-name.missing": "links-without-text",
  "accessibility.button-name.missing": "buttons-without-text",
  "accessibility.lang.missing": "missing-page-language",
  "performance.lcp.slow": "slow-main-content",
  "performance.cls.high": "page-layout-shifts",
  "performance.interactivity.slow": "slow-response-to-taps",
  "performance.first-paint.slow": "slow-first-paint",
  "performance.server.slow": "slow-server-response",
  "performance.images.unoptimized": "images-too-large",
  "performance.render-blocking": "render-blocking-resources",
  "performance.unused-code": "unused-code",
  "performance.text-compression": "missing-text-compression",
  "performance.caching": "missing-browser-caching",
  "local.schema.missing": "missing-local-business-details",
  "local.phone.missing": "missing-clickable-phone-number",
  "local.address.missing": "missing-business-address",
  "local.hours.missing": "missing-opening-hours",
  "local.map.missing": "missing-map",
} as const satisfies Record<Exclude<CheckId, "performance.other">, string>;

export type GuideId = keyof typeof guideSlugs;
export const guideIds = Object.keys(guideSlugs) as GuideId[];

const idBySlug = new Map<string, GuideId>(guideIds.map((id) => [guideSlugs[id], id]));

export function guideIdForSlug(slug: string): GuideId | null {
  return idBySlug.get(slug) ?? null;
}

/** The guide for an issue id, if there is one (unknown and fallback ids have none). */
export function guideSlugFor(id: string): string | null {
  return Object.hasOwn(guideSlugs, id) ? guideSlugs[id as GuideId] : null;
}

/** Guides grouped by area, local-business guides on their own, in registry order. */
export function guideGroups(): { key: Category | "local"; ids: GuideId[] }[] {
  const keys: (Category | "local")[] = ["seo", "performance", "accessibility", "technical", "local"];
  return keys.map((key) => ({
    key,
    ids: guideIds.filter((id) => {
      const definition = checkRegistry[id];
      const isLocal = "local" in definition && definition.local === true;
      return key === "local" ? isLocal : !isLocal && definition.category === key;
    }),
  }));
}

/** Up to `count` other guides from the same group, starting after this one so links spread out. */
export function relatedGuides(id: GuideId, count = 4): GuideId[] {
  const group = guideGroups().find((candidate) => candidate.ids.includes(id))?.ids ?? [];
  const start = group.indexOf(id);
  const rotated = [...group.slice(start + 1), ...group.slice(0, start)];
  return rotated.slice(0, count);
}

/** A hand-picked set for the landing page: the problems small business owners search for most. */
export const popularGuides: GuideId[] = [
  "seo.meta-description.missing",
  "seo.title.missing",
  "performance.images.unoptimized",
  "seo.viewport.missing",
  "technical.https.missing",
  "accessibility.img-alt.missing",
];
