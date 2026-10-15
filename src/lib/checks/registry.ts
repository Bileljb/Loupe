import type { Category, Issue, Severity } from "@/lib/schemas";

type CheckDefinition = {
  category: Category;
  severity: Severity;
  local?: true; // only runs when the user opts into local business checks
};

/**
 * Every HTML check id. The knowledge base (Phase 3) is typed against these keys.
 * Ids are stable: renaming one breaks old shared reports, so add new ids instead.
 */
export const checkRegistry = {
  // SEO
  "seo.title.missing": { category: "seo", severity: "critical" },
  "seo.title.too-short": { category: "seo", severity: "warning" },
  "seo.title.too-long": { category: "seo", severity: "info" },
  "seo.meta-description.missing": { category: "seo", severity: "warning" },
  "seo.meta-description.too-short": { category: "seo", severity: "info" },
  "seo.meta-description.too-long": { category: "seo", severity: "info" },
  "seo.h1.missing": { category: "seo", severity: "warning" },
  "seo.h1.multiple": { category: "seo", severity: "info" },
  "seo.headings.skipped-level": { category: "seo", severity: "info" },
  "seo.canonical.missing": { category: "seo", severity: "info" },
  "seo.viewport.missing": { category: "seo", severity: "warning" },
  "seo.open-graph.incomplete": { category: "seo", severity: "info" },
  "seo.noindex": { category: "seo", severity: "critical" },

  // Technical
  "technical.https.missing": { category: "technical", severity: "critical" },
  "technical.status.error": { category: "technical", severity: "critical" },
  "technical.redirects.too-many": { category: "technical", severity: "warning" },
  "technical.mixed-content": { category: "technical", severity: "warning" },
  "technical.headers.hsts.missing": { category: "technical", severity: "info" },
  "technical.headers.csp.missing": { category: "technical", severity: "info" },
  "technical.headers.frame-options.missing": { category: "technical", severity: "info" },
  "technical.headers.content-type-options.missing": { category: "technical", severity: "info" },
  "technical.favicon.missing": { category: "technical", severity: "info" },
  "technical.robots-txt.missing": { category: "technical", severity: "warning" },
  "technical.sitemap.missing": { category: "technical", severity: "warning" },

  // Accessibility (automated checks only). lang and alt text live here, not in SEO, so they count once.
  "accessibility.img-alt.missing": { category: "accessibility", severity: "warning" },
  "accessibility.form-label.missing": { category: "accessibility", severity: "warning" },
  "accessibility.link-name.missing": { category: "accessibility", severity: "warning" },
  "accessibility.button-name.missing": { category: "accessibility", severity: "warning" },
  "accessibility.lang.missing": { category: "accessibility", severity: "warning" },

  // Local business (opt-in)
  "local.schema.missing": { category: "seo", severity: "warning", local: true },
  "local.phone.missing": { category: "seo", severity: "warning", local: true },
  "local.address.missing": { category: "seo", severity: "warning", local: true },
  "local.hours.missing": { category: "seo", severity: "info", local: true },
  "local.map.missing": { category: "seo", severity: "info", local: true },
} as const satisfies Record<string, CheckDefinition>;

export type CheckId = keyof typeof checkRegistry;
export const checkIds = Object.keys(checkRegistry) as CheckId[];

export function makeIssue(id: CheckId, passed: boolean, evidence?: Record<string, unknown>): Issue {
  const definition: CheckDefinition = checkRegistry[id];
  return {
    id,
    category: definition.category,
    severity: definition.severity,
    passed,
    ...(evidence && Object.keys(evidence).length > 0 ? { evidence } : {}),
    ...(definition.local ? { tags: ["local" as const] } : {}),
  };
}
