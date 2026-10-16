import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Reports show text from untrusted sites (titles, meta values, URLs). They must only ever reach the
// page as React text, which is escaped. This guard fails if code starts using a raw-HTML sink.
// JSON-LD (Phase 10) will need one reviewed exception: add it to ALLOWED with a reason.
const SINKS = /dangerouslySetInnerHTML|\.innerHTML\s*=|outerHTML|insertAdjacentHTML|document\.write|new Function\(|\beval\(/;
const ALLOWED = new Set<string>();

const root = join(__dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("no raw HTML sinks", () => {
  it.each(sourceFiles(root).map((path) => relative(root, path).replaceAll("\\", "/")))("%s", (file) => {
    if (ALLOWED.has(file)) return;
    expect(readFileSync(join(root, file), "utf8")).not.toMatch(SINKS);
  });
});
