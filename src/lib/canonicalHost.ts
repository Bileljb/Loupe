/**
 * The URL to permanently redirect to when a request arrives on the www/apex twin of the canonical
 * host (from NEXT_PUBLIC_SITE_URL), or null. Other hosts (previews, localhost) are left alone.
 */
export function canonicalRedirect(requestUrl: URL, host: string | null, siteUrl: string | undefined): URL | null {
  if (!siteUrl || !host) return null;
  let canonical: URL;
  try {
    canonical = new URL(siteUrl);
  } catch {
    return null;
  }
  const requestHost = host.toLowerCase();
  const canonicalHost = canonical.host.toLowerCase();
  const twin = canonicalHost.startsWith("www.") ? canonicalHost.slice(4) : `www.${canonicalHost}`;
  if (requestHost !== twin) return null;

  const target = new URL(requestUrl.pathname + requestUrl.search, canonical.origin);
  return target;
}
