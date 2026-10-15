import { z } from "zod";
import { checkUrlShape } from "./security/ssrf";

const explicitScheme = /^[a-z][a-z\d+.-]*:\/\//i;
// Schemes written without "//" (mailto:, data:...) must not be mistaken for "host:port".
const opaqueScheme = /^(about|blob|data|file|javascript|mailto|tel|vbscript):/i;

/**
 * Adds https:// when no scheme is given, strips the fragment, and lets the WHATWG parser
 * lowercase the host and canonicalize IP spellings (e.g. 2130706433 -> 127.0.0.1).
 */
export function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate =
    explicitScheme.test(trimmed) || opaqueScheme.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

export const auditInputSchema = z.object({
  url: z
    .string()
    .max(2048)
    .transform((value, ctx) => {
      const url = normalizeUrl(value);
      const code = url ? checkUrlShape(url) : "INVALID_URL";
      if (!url || code) {
        // The message is an error code; the UI translates it via Errors.<code>.
        ctx.addIssue({ code: "custom", message: code ?? "INVALID_URL" });
        return z.NEVER;
      }
      return url.href;
    }),
  localChecks: z.boolean().default(false),
});

export type AuditInput = z.infer<typeof auditInputSchema>;

export const severitySchema = z.enum(["critical", "warning", "info"]);
export type Severity = z.infer<typeof severitySchema>;

export const categorySchema = z.enum(["performance", "seo", "accessibility", "technical"]);
export type Category = z.infer<typeof categorySchema>;

export const platformNameSchema = z.enum(["wordpress", "wix", "shopify", "squarespace", "webflow", "unknown"]);
export type Platform = z.infer<typeof platformNameSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const issueSchema = z.object({
  // Plain string, not CheckId: stored reports may hold ids from older versions or from PSI.
  id: z.string().min(1),
  category: categorySchema,
  severity: severitySchema,
  passed: z.boolean(),
  // Raw values from an untrusted site. Escape before rendering.
  evidence: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.literal("local")).optional(),
});
export type Issue = z.infer<typeof issueSchema>;

const score = z.number().int().min(0).max(100);
// null: the category couldn't be checked (e.g. PSI failed). Never shown as a made-up 100.
const categoryScore = score.nullable();

export const reportSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(12),
  url: z.string(),
  createdAt: z.iso.datetime(),
  scores: z.object({
    overall: score,
    performance: categoryScore,
    seo: categoryScore,
    accessibility: categoryScore,
    technical: categoryScore,
  }),
  issues: z.array(issueSchema),
  partial: z
    .object({
      psiFailed: z.boolean().optional(),
      htmlFailed: z.boolean().optional(),
      jsShellSuspected: z.boolean().optional(),
    })
    .optional(),
  platform: z.object({ name: platformNameSchema, confidence: confidenceSchema }).optional(),
  localChecks: z.boolean(),
  previousReportId: z.string().optional(),
});
export type Report = z.infer<typeof reportSchema>;
