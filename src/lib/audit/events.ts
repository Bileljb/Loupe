// Shared by the API route and the browser: no server-only imports here.
import { fetchErrorCodes } from "@/lib/security/errors";
import type { AuditProgress, AuditStage } from "./runAudit";

/** Every error the client can be told about. Each maps to Errors.<code> in messages/*.json. */
export const auditErrorCodes = [...fetchErrorCodes, "RATE_LIMITED", "SERVER_ERROR"] as const;
export type AuditErrorCode = (typeof auditErrorCodes)[number];

/** One JSON object per line (NDJSON) on the POST /api/audit response. */
export type AuditStreamEvent =
  | AuditProgress
  | { type: "done"; id: string; cached: boolean }
  /** retryAfter (seconds) comes with RATE_LIMITED. */
  | { type: "error"; code: AuditErrorCode; retryAfter?: number };

const stages: readonly AuditStage[] = ["performance", "page"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStage(value: unknown): value is AuditStage {
  return stages.includes(value as AuditStage);
}

/** Validates one event from the stream. Hand-written so the landing page doesn't ship Zod. */
export function parseAuditEvent(value: unknown): AuditStreamEvent | null {
  if (!isRecord(value)) return null;
  switch (value.type) {
    case "started":
      return Array.isArray(value.stages) && value.stages.every(isStage)
        ? { type: "started", stages: value.stages }
        : null;
    case "stage":
      return isStage(value.stage) && (value.status === "done" || value.status === "failed")
        ? { type: "stage", stage: value.stage, status: value.status }
        : null;
    case "done":
      return typeof value.id === "string" && /^[A-Za-z0-9_-]{12,64}$/.test(value.id)
        ? { type: "done", id: value.id, cached: value.cached === true }
        : null;
    case "error": {
      const code = isAuditErrorCode(value.code) ? value.code : "SERVER_ERROR";
      const retryAfter = value.retryAfter;
      return typeof retryAfter === "number" && Number.isFinite(retryAfter) && retryAfter > 0
        ? { type: "error", code, retryAfter: Math.ceil(retryAfter) }
        : { type: "error", code };
    }
    default:
      return null;
  }
}

export function isAuditErrorCode(value: unknown): value is AuditErrorCode {
  return (auditErrorCodes as readonly unknown[]).includes(value);
}

/** Splits a byte stream into parsed NDJSON lines. Malformed lines are skipped. */
export async function* readAuditEvents(stream: ReadableStream<Uint8Array>): AsyncGenerator<AuditStreamEvent> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const parseLine = (line: string): AuditStreamEvent | null => {
    if (!line.trim()) return null;
    try {
      return parseAuditEvent(JSON.parse(line));
    } catch {
      return null;
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    // stream: true keeps multi-byte characters intact across chunk boundaries.
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const event = parseLine(line);
      if (event) yield event;
    }
  }
  const last = parseLine(buffer + decoder.decode());
  if (last) yield last;
}
