import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Skip /api (the audit API is not locale-prefixed), Next internals, Vercel internals,
  // and any path containing a dot (static files such as favicon.ico, robots.txt, sitemap.xml).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
