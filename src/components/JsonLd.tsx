type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };

/** A schema.org object. `@type` is required so every block says what it describes. */
export type JsonLdData = { "@context": "https://schema.org"; "@type": string } & { [key: string]: JsonValue | undefined };

/**
 * Structured data for search engines. Our data only (never text from audited sites), and `<` is
 * escaped so no value can close the script tag. The one reviewed exception in security/xss.test.ts.
 */
export function JsonLd({ data }: { data: JsonLdData | JsonLdData[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
