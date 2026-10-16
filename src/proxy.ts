import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { canonicalRedirect } from "./lib/canonicalHost";
import { guideIdForSlug } from "./lib/guides";

const handleI18n = createMiddleware(routing);
const guidePath = new RegExp(`^/(${routing.locales.join("|")})/guides/([^/]+)/?$`);

export default function proxy(request: NextRequest) {
  // One canonical host: www and apex twins get a permanent redirect before anything else.
  const target = canonicalRedirect(request.nextUrl, request.headers.get("host"), process.env.NEXT_PUBLIC_SITE_URL);
  if (target) return NextResponse.redirect(target, 308);

  // Guide pages stream, so a bad slug found inside the page would answer 200. Unknown slugs are
  // rewritten to the catch-all route instead, which answers a real 404 before streaming starts.
  const guide = guidePath.exec(request.nextUrl.pathname);
  if (guide && !guideIdForSlug(decodeURIComponent(guide[2] ?? ""))) {
    return NextResponse.rewrite(new URL(`/${guide[1]}/not-found`, request.url));
  }

  return handleI18n(request);
}

export const config = {
  // Skip /api (the audit API is not locale-prefixed), Next internals, Vercel internals,
  // and any path containing a dot (static files such as favicon.ico, robots.txt, sitemap.xml).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
