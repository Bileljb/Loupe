// Single source for brand details. Renaming the product is a one-line change here.
export const siteConfig = {
  name: "Loupe",
  // Fallback for local development; production sets NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
} as const;
