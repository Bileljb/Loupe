import { z } from "zod";
import { auditAndSave } from "@/lib/audit/auditAndSave";
import type { AuditStreamEvent } from "@/lib/audit/events";
import { auditLimiter, psiLimiter } from "@/lib/audit/limits";
import { logEvent } from "@/lib/log";
import { FetchError } from "@/lib/security/errors";
import { clientKey } from "@/lib/security/rateLimit";

// PSI alone may take up to 60s (see psiClient). Check the plan's limit on Vercel (Phase 11).
export const maxDuration = 90;

const bodySchema = z.object({
  url: z.string().max(2048),
  localChecks: z.boolean().optional(),
  // Re-scan of an existing report: fresh audit (no cache), linked for the compare view.
  rescanOf: z.string().regex(/^[A-Za-z0-9_-]{12,64}$/).optional(),
});

const headers = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const line = (event: AuditStreamEvent) => `${JSON.stringify(event)}\n`;

// One shared budget for the whole app, so every request checks the same key.
const allowPsi = async () => (await psiLimiter().check("global")).allowed;

/** Runs one audit and streams progress as NDJSON, ending with `done` (report id) or `error` (code only). */
export async function POST(request: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(line({ type: "error", code: "INVALID_URL" }), { status: 400, headers });
  }

  // Every audit counts, re-scans and cached results included: the limit is about abuse, not cost.
  const limit = await auditLimiter().check(clientKey(request.headers));
  if (!limit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    logEvent("info", "audit.rate_limited");
    return new Response(line({ type: "error", code: "RATE_LIMITED", retryAfter }), {
      status: 429,
      headers: { ...headers, "Retry-After": String(retryAfter) },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AuditStreamEvent) => controller.enqueue(encoder.encode(line(event)));
      const { rescanOf, ...input } = parsed.data;
      try {
        const { report, cached } = await auditAndSave(input, {
          onProgress: send,
          allowPsi,
          ...(rescanOf ? { rescanOf } : {}),
        });
        logEvent("info", "audit.completed", {
          cached,
          rescan: rescanOf !== undefined,
          psiFailed: report.partial?.psiFailed ?? false,
          htmlFailed: report.partial?.htmlFailed ?? false,
        });
        send({ type: "done", id: report.id, cached });
      } catch (error) {
        if (error instanceof FetchError) {
          logEvent("info", "audit.rejected", { code: error.code });
          send({ type: "error", code: error.code });
        } else {
          // Never pass upstream details to the client; log only the error type.
          logEvent("error", "audit.failed", { error: error instanceof Error ? error.name : typeof error });
          send({ type: "error", code: "SERVER_ERROR" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
