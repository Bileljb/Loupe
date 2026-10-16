import { describe, expect, it } from "vitest";
import { parseAuditEvent, readAuditEvents, type AuditStreamEvent } from "./events";

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<AuditStreamEvent[]> {
  const events: AuditStreamEvent[] = [];
  for await (const event of readAuditEvents(stream)) events.push(event);
  return events;
}

describe("readAuditEvents", () => {
  it("parses lines split across chunks, with or without a final newline", async () => {
    const events = await collect(
      streamOf(
        '{"type":"started","stages":["performance","page"]}\n{"type":"sta',
        'ge","stage":"page","status":"done"}\n',
        '{"type":"done","id":"abcdefghijklmnop","cached":false}',
      ),
    );
    expect(events).toEqual([
      { type: "started", stages: ["performance", "page"] },
      { type: "stage", stage: "page", status: "done" },
      { type: "done", id: "abcdefghijklmnop", cached: false },
    ]);
  });

  it("skips malformed and unknown lines", async () => {
    const events = await collect(streamOf('not json\n{"type":"surprise"}\n\n{"type":"error","code":"TIMEOUT"}\n'));
    expect(events).toEqual([{ type: "error", code: "TIMEOUT" }]);
  });
});

describe("parseAuditEvent", () => {
  it("turns an unknown error code into SERVER_ERROR", () => {
    expect(parseAuditEvent({ type: "error", code: "<script>" })).toEqual({ type: "error", code: "SERVER_ERROR" });
  });

  it("rejects a report id that isn't one of ours", () => {
    expect(parseAuditEvent({ type: "done", id: "../../admin" })).toBeNull();
    expect(parseAuditEvent({ type: "stage", stage: "secret", status: "done" })).toBeNull();
  });
});
