import { beforeEach, describe, expect, it, vi } from "vitest";
import { readAuditEvents, type AuditStreamEvent } from "@/lib/audit/events";
import type { AuditAndSaveOptions } from "@/lib/audit/auditAndSave";
import type { Report } from "@/lib/schemas";
import { FetchError } from "@/lib/security/errors";

const { auditAndSave } = vi.hoisted(() => ({ auditAndSave: vi.fn() }));
vi.mock("@/lib/audit/auditAndSave", () => ({ auditAndSave }));

const { POST } = await import("./route");

function post(body: unknown): Request {
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function events(response: Response): Promise<AuditStreamEvent[]> {
  const list: AuditStreamEvent[] = [];
  if (!response.body) return list;
  for await (const event of readAuditEvents(response.body)) list.push(event);
  return list;
}

describe("POST /api/audit", () => {
  beforeEach(() => {
    auditAndSave.mockReset();
  });

  it("streams progress, then the report id", async () => {
    auditAndSave.mockImplementation(async (_input: unknown, options: AuditAndSaveOptions) => {
      options.onProgress?.({ type: "started", stages: ["performance", "page"] });
      options.onProgress?.({ type: "stage", stage: "page", status: "done" });
      options.onProgress?.({ type: "stage", stage: "performance", status: "failed" });
      return { report: { id: "abcdefghijklmnop" } as Report, cached: false };
    });
    const response = await POST(post({ url: "example.com", localChecks: true }));
    expect(response.headers.get("content-type")).toContain("application/x-ndjson");
    expect(auditAndSave.mock.calls[0]?.[0]).toEqual({ url: "example.com", localChecks: true });
    expect(await events(response)).toEqual([
      { type: "started", stages: ["performance", "page"] },
      { type: "stage", stage: "page", status: "done" },
      { type: "stage", stage: "performance", status: "failed" },
      { type: "done", id: "abcdefghijklmnop", cached: false },
    ]);
  });

  it("passes a re-scan request through", async () => {
    auditAndSave.mockResolvedValue({ report: { id: "newreport0000001" } as Report, cached: false });
    await events(await POST(post({ url: "example.com", rescanOf: "oldreport0000001" })));
    expect(auditAndSave.mock.calls[0]?.[0]).toEqual({ url: "example.com" });
    expect(auditAndSave.mock.calls[0]?.[1]).toMatchObject({ rescanOf: "oldreport0000001" });
  });

  it("sends the error code of a known failure", async () => {
    auditAndSave.mockRejectedValue(new FetchError("BLOCKED"));
    expect(await events(await POST(post({ url: "localhost" })))).toEqual([{ type: "error", code: "BLOCKED" }]);
  });

  it("hides the details of unexpected failures", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    auditAndSave.mockRejectedValue(new Error("redis password is hunter2"));
    const response = await POST(post({ url: "example.com" }));
    const text = await response.text();
    expect(text).toBe('{"type":"error","code":"SERVER_ERROR"}\n');
    expect(console.error).not.toHaveBeenCalledWith(expect.anything(), expect.stringContaining("hunter2"));
  });

  it.each([
    ["not json"],
    [{}],
    [{ url: 42 }],
    [{ url: "a".repeat(3000) }],
    [{ url: "example.com", rescanOf: "../../report" }],
  ])("rejects a bad body (%#)", async (body) => {
    const response = await POST(post(body));
    expect(response.status).toBe(400);
    expect(await events(response)).toEqual([{ type: "error", code: "INVALID_URL" }]);
    expect(auditAndSave).not.toHaveBeenCalled();
  });
});
