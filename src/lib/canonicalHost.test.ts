import { describe, expect, it } from "vitest";
import { canonicalRedirect } from "./canonicalHost";

const at = (url: string) => new URL(url);

describe("canonicalRedirect", () => {
  it("sends www to the apex when the apex is canonical, keeping path and query", () => {
    expect(canonicalRedirect(at("https://www.loupe.example/fr/guides?x=1"), "www.loupe.example", "https://loupe.example")?.toString()).toBe(
      "https://loupe.example/fr/guides?x=1",
    );
  });

  it("sends the apex to www when www is canonical", () => {
    expect(canonicalRedirect(at("https://loupe.example/en"), "loupe.example", "https://www.loupe.example")?.toString()).toBe(
      "https://www.loupe.example/en",
    );
  });

  it("leaves the canonical host, previews and localhost alone", () => {
    expect(canonicalRedirect(at("https://loupe.example/en"), "loupe.example", "https://loupe.example")).toBeNull();
    expect(canonicalRedirect(at("https://loupe-git-x.vercel.app/en"), "loupe-git-x.vercel.app", "https://loupe.example")).toBeNull();
    expect(canonicalRedirect(at("http://localhost:3000/en"), "localhost:3000", "https://loupe.example")).toBeNull();
    expect(canonicalRedirect(at("https://www.loupe.example/en"), "www.loupe.example", undefined)).toBeNull();
  });
});
