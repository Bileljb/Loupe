import { describe, expect, it } from "vitest";
import { detectPlatform } from "./platform";
import { fixture } from "./testUtils";

describe("detectPlatform", () => {
  it.each([
    ["wordpress.html", "wordpress"],
    ["wix.html", "wix"],
    ["shopify.html", "shopify"],
    ["squarespace.html", "squarespace"],
    ["webflow.html", "webflow"],
  ] as const)("detects %s as %s with high confidence", (file, name) => {
    expect(detectPlatform(fixture(file), {})).toEqual({ name, confidence: "high" });
  });

  it("returns unknown for a hand-built site", () => {
    expect(detectPlatform(fixture("good.html"), {})).toEqual({ name: "unknown", confidence: "low" });
  });

  it("gives medium confidence for a single strong signal", () => {
    expect(detectPlatform('<img src="https://example.com/wp-content/uploads/a.jpg">', {})).toEqual({
      name: "wordpress",
      confidence: "medium",
    });
  });

  it("gives low confidence for a weak signal only", () => {
    expect(detectPlatform('<a href="https://shop.myshopify.com">Shop</a>', {})).toEqual({
      name: "shopify",
      confidence: "low",
    });
  });

  it("uses response headers", () => {
    expect(detectPlatform("<html></html>", { "x-shopid": "123", "x-shopify-stage": "production" })).toEqual({
      name: "shopify",
      confidence: "high",
    });
    expect(detectPlatform("<html></html>", { server: "Squarespace" })).toEqual({
      name: "squarespace",
      confidence: "medium",
    });
  });

  it("picks the platform with the most strong signals", () => {
    const html = `${fixture("shopify.html")}<img src="https://example.com/wp-content/a.jpg">`;
    expect(detectPlatform(html, {}).name).toBe("shopify");
  });
});
