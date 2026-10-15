// Single source for brand details. Renaming the product is a one-line change here.
const name = "Loupe";
// Fallback for local development; production sets NEXT_PUBLIC_SITE_URL.
const url = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const siteConfig = {
  name,
  url,
  // Honest User-Agent: names the tool and links to it, so site owners know who is visiting.
  userAgent: `${name}Bot/1.0 (+${url})`,
} as const;
