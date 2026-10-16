import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("can't be broken out of, even by a hostile value", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Thing", name: "</script><script>alert(1)</script>" }} />,
    );
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).not.toContain("</script><script>");
    const json = html.replace(/^<script[^>]*>/, "").replace(/<\/script>$/, "");
    expect(JSON.parse(json)).toEqual({ "@context": "https://schema.org", "@type": "Thing", name: "</script><script>alert(1)</script>" });
  });
});
