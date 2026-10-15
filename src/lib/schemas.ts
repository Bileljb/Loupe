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
