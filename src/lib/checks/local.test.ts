import { describe, expect, it } from "vitest";
import { localChecks } from "./local";
import { failedIds, find, fixture, page } from "./testUtils";

const run = (html: string) => localChecks(page(html));

describe("local business checks", () => {
  it("passes a complete local business page", () => {
    const issues = run(fixture("local-pass.html"));
    expect(failedIds(issues)).toEqual([]);
    expect(find(issues, "local.schema.missing").evidence).toEqual({ types: ["Bakery", "LocalBusiness"] });
  });

  it("fails a page without local details, and notes a phone number without a tap-to-call link", () => {
    const issues = run(fixture("local-fail.html"));
    expect(failedIds(issues)).toEqual(
      ["local.address.missing", "local.hours.missing", "local.map.missing", "local.phone.missing", "local.schema.missing"].sort(),
    );
    expect(find(issues, "local.phone.missing").evidence).toMatchObject({ telLinks: [], phoneNumberInText: true });
  });

  it("recognizes subtypes with a full schema.org URL as the type", () => {
    const html = `<script type="application/ld+json">{"@type":"https://schema.org/Dentist","address":"1 Main St"}</script>`;
    const issues = run(html);
    expect(find(issues, "local.schema.missing").passed).toBe(true);
    expect(find(issues, "local.address.missing").passed).toBe(true);
  });

  it("does not count a plain Organization as a local business", () => {
    const html = `<script type="application/ld+json">{"@type":"Organization","address":"1 Main St"}</script>`;
    expect(find(run(html), "local.schema.missing").passed).toBe(false);
    expect(find(run(html), "local.address.missing").passed).toBe(false);
  });

  it("accepts openingHours as a string", () => {
    const html = `<script type="application/ld+json">[{"@type":"Restaurant","openingHours":"Mo-Fr 09:00-17:00"}]</script>`;
    expect(find(run(html), "local.hours.missing").passed).toBe(true);
  });

  it("finds an <address> element without structured data", () => {
    expect(find(run("<address>3 Avenue Habib Bourguiba, Tunis</address>"), "local.address.missing")).toMatchObject({
      passed: true,
      evidence: { inStructuredData: false, addressElement: "3 Avenue Habib Bourguiba, Tunis" },
    });
  });

  it.each([
    '<a href="https://maps.app.goo.gl/abc">Find us</a>',
    '<a href="https://www.google.com/maps/place/Tunis">Map</a>',
    '<a href="https://maps.google.fr/?q=Lyon">Map</a>',
    '<iframe src="https://www.google.com/maps/embed?pb=1"></iframe>',
  ])("finds a map in %s", (html) => {
    expect(find(run(html), "local.map.missing").passed).toBe(true);
  });
});
