import { z } from "zod";
import { auditAndSave } from "@/lib/audit/auditAndSave";
import type { AuditStreamEvent } from "@/lib/audit/events";
import { FetchError } from "@/lib/security/errors";

// PSI alone may take up to 60s (see psiClient). Check the plan's limit on Vercel (Phase 11).
export const maxDuration = 90;

const bodySchema = z.object({
  url: z.string().max(2048),
  localChecks: z.boolean().optional(),
});

const headers = {
  "Content-Type": "application/x-ndjson; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

const line = (event: AuditStreamEvent) => `${JSON.stringify(event)}\n`;

/** Runs one audit and streams progress as NDJSON, ending with `done` (report id) or `error` (code only). */
export async function POST(request: Request): Promise<Response> {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return new Response(line({ type: "error", code: "INVALID_URL" }), { status: 400, headers });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AuditStreamEvent) => controller.enqueue(encoder.encode(line(event)));
      try {
        const { report, cached } = await auditAndSave(parsed.data, { onProgress: send });
        send({ type: "done", id: report.id, cached });
      } catch (error) {
        if (error instanceof FetchError) {
          send({ type: "error", code: error.code });
        } else {
          // Never pass upstream details to the client; log only the error type.
          console.error("[audit] unexpected failure:", error instanceof Error ? error.name : typeof error);
          send({ type: "error", code: "SERVER_ERROR" });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
