import { describe, expect, it } from "vitest";
import { checkIds } from "@/lib/checks/registry";
import { guideGroups, guideIdForSlug, guideIds, guideSlugFor, guideSlugs, popularGuides, relatedGuides } from "./guides";

describe("guide slugs", () => {
  it("cover every check except the PSI fallback", () => {
    expect([...guideIds].sort()).toEqual(checkIds.filter((id) => id !== "performance.other").sort());
  });

  it("are unique, lowercase and URL-safe", () => {
    const slugs = Object.values(guideSlugs);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("round-trip between ids and slugs", () => {
    for (const id of guideIds) expect(guideIdForSlug(guideSlugs[id])).toBe(id);
    expect(guideIdForSlug("no-such-guide")).toBeNull();
    expect(guideSlugFor("performance.other")).toBeNull();
    expect(guideSlugFor("lighthouse.something-new")).toBeNull();
  });
});

describe("guide groups", () => {
  it("put every guide in exactly one group, with local-business guides apart", () => {
    const grouped = guideGroups().flatMap((group) => group.ids);
    expect(grouped.sort()).toEqual([...guideIds].sort());
    expect(guideGroups().find((group) => group.key === "local")?.ids.every((id) => id.startsWith("local."))).toBe(true);
  });

  it("relate guides from the same group, never the guide itself", () => {
    const related = relatedGuides("seo.title.missing");
    expect(related).toHaveLength(4);
    expect(related).not.toContain("seo.title.missing");
    expect(related.every((id) => id.startsWith("seo."))).toBe(true);
  });

  it("only feature guides that exist", () => {
    for (const id of popularGuides) expect(guideIds).toContain(id);
  });
});
