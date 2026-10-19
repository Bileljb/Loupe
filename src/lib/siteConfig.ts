// Single source for brand details. Renaming the product is a one-line change here.
const name = "Loupe";
// NEXT_PUBLIC_SITE_URL wins. On Vercel, fall back to the project's production domain (set
// automatically, without the scheme), so a missing setting never puts localhost in links.
const vercelDomain = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
const url =
  process.env.NEXT_PUBLIC_SITE_URL || (vercelDomain ? `https://${vercelDomain}` : "http://localhost:3000");

export const siteConfig = {
  name,
  url,
  // Honest User-Agent: names the tool and links to it, so site owners know who is visiting.
  userAgent: `${name}Bot/1.0 (+${url})`,
} as const;
