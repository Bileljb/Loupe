import { describe, expect, it } from "vitest";
import { detectJsShell } from "./jsShell";
import { fixture, page } from "./testUtils";

describe("detectJsShell", () => {
  it("flags an empty app root filled in by JavaScript", () => {
    expect(detectJsShell(page(fixture("js-shell.html")))).toBe(true);
  });

  it("does not flag a server-rendered page", () => {
    expect(detectJsShell(page(fixture("good.html")))).toBe(false);
  });

  it("does not flag a short page with no scripts", () => {
    expect(detectJsShell(page("<html><head><title>Hi</title></head><body><h1>Coming soon</h1></body></html>"))).toBe(false);
  });

  it("does not flag a server-rendered React page with content inside #root", () => {
    const text = "Fresh bread every morning. ".repeat(10);
    const html = `<html><head><title>Bakery</title></head><body><div id="root"><h1>Bakery</h1><p>${text}</p></div><script src="/app.js"></script></body></html>`;
    expect(detectJsShell(page(html))).toBe(false);
  });

  it("does not let script text count as page content", () => {
    const html = `<html><body><div id="__next"></div><script>${"var x = 1;".repeat(100)}</script></body></html>`;
    expect(detectJsShell(page(html))).toBe(true);
  });

  it("leaves the shared parse tree untouched", () => {
    const parsed = page(fixture("js-shell.html"));
    detectJsShell(parsed);
    expect(parsed.$("script").length).toBe(1);
  });
});
