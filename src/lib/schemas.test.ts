import { describe, expect, it } from "vitest";
import { auditInputSchema, normalizeUrl } from "./schemas";

describe("normalizeUrl", () => {
  it.each([
    ["example.com", "https://example.com/"],
    ["  Example.COM/Path  ", "https://example.com/Path"],
    ["https://WWW.Example.com/page#section", "https://www.example.com/page"],
    ["http://example.com", "http://example.com/"],
    ["example.com:443/x", "https://example.com/x"],
    ["https://example.com/?q=1#top", "https://example.com/?q=1"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeUrl(input)?.href).toBe(expected);
  });

  it.each(["", "   ", "https://", "http://exa mple.com"])("returns null for %j", (input) => {
    expect(normalizeUrl(input)).toBeNull();
  });
});

describe("auditInputSchema", () => {
  it("normalizes the URL and defaults localChecks to false", () => {
    expect(auditInputSchema.parse({ url: "Example.com#x" })).toEqual({
      url: "https://example.com/",
      localChecks: false,
    });
  });

  it.each([
    ["", "INVALID_URL"],
    ["file:///etc/passwd", "INVALID_URL"],
    ["https://user:pass@example.com", "INVALID_URL"],
    ["localhost:3000", "BLOCKED"],
    ["127.0.0.1", "BLOCKED"],
    ["http://169.254.169.254/", "BLOCKED"],
    ["[::1]", "BLOCKED"],
  ])("rejects %j with code %s", (url, code) => {
    const result = auditInputSchema.safeParse({ url });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(code);
  });

  it("rejects overly long input", () => {
    expect(auditInputSchema.safeParse({ url: `https://example.com/${"a".repeat(3000)}` }).success).toBe(false);
  });
});
