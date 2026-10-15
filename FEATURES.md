# Features by phase

Every feature planned for the MVP, grouped by build phase. The source of truth for rules and details is [CLAUDE.md](CLAUDE.md); this file is the at-a-glance list.

Status: ✅ done · ⏳ waiting on you (account or manual task) · ⬜ not started

---

## Phase 0: Project setup ✅

| Feature | Status |
|---|---|
| Next.js 16 app (App Router, TypeScript strict, Tailwind 4, ESLint, Cache Components) | ✅ |
| shadcn/ui with RTL support: button, input, card, badge, accordion, skeleton, alert, direction provider | ✅ |
| Core libraries installed: zod, cheerio, Upstash Redis + Ratelimit, next-intl, Vitest | ✅ |
| Language routing: `/en`, `/fr`, `/ar`, with browser-language detection on the first visit only and a remembered choice (1-year cookie) | ✅ |
| `lang` and `dir="rtl"` set per language | ✅ |
| Latin font (Geist) + Arabic font (Noto Sans Arabic) via `next/font`; monospace font for code | ✅ |
| Language switcher (English / Français / العربية) that keeps you on the same page | ✅ |
| `/api` and static files excluded from language routing | ✅ |
| `.env.example` committed, `.env.local` ignored | ✅ |
| Scripts: `typecheck`, `lint`, `test` | ✅ |
| Folder structure from CLAUDE.md | ✅ |
| `siteConfig.ts` holds the brand name and site URL (rename in one place) | ✅ |
| Test: every message key exists in all three languages | ✅ |
| PageSpeed Insights API key | ⏳ |
| Upstash Redis database | ⏳ |

## Phase 1: Input validation and safe fetching ✅

| Feature | Status |
|---|---|
| URL input check and clean-up: adds `https://` if missing, strips `#fragment`, lowercases the host | ✅ |
| Only `http` and `https` allowed; URLs with usernames/passwords rejected; non-standard ports rejected | ✅ |
| Blocks private and internal addresses (IPv4 and IPv6), checked on every resolved address | ✅ |
| Blocks disguised internal addresses (decimal/hex/octal IPs, IPv4-in-IPv6, single-word hostnames) | ✅ |
| Safe fetch: 10s overall timeout, 2 MB size cap (after decompression), accepted content types per file | ✅ |
| Redirects followed manually (max 5), each hop re-checked | ✅ |
| Connection pinned to the checked IP address (DNS-rebinding protection) | ✅ |
| Honest User-Agent naming the tool and linking to its site | ✅ |
| Fetches only the homepage, `robots.txt` and `sitemap.xml` (enforced by the orchestrator in Phase 5) | ⬜ |
| Friendly error for each failure, in all three languages: invalid URL, blocked, timeout, not HTML, too large, unreachable, too many redirects | ✅ |
| Tests: localhost, `127.0.0.1`, `10.x`, `169.254.169.254`, IPv6 loopback, `file://`, redirect to private IP, credentials in URL | ✅ |

## Phase 2: Core model and HTML checks ✅

| Feature | Status |
|---|---|
| Typed data model: Issue, Report, Category, Severity, Platform (Zod) | ✅ |
| One registry of 35 check ids with category and severity (the knowledge base is typed against it) | ✅ |
| **SEO checks:** title (missing, too short, too long), meta description (missing, too short, too long), H1 (missing, multiple), heading order, canonical, viewport, Open Graph basics, `noindex` (meta tag and header) | ✅ |
| **Technical checks:** HTTPS, final status code, redirect chain length, mixed content, security headers (HSTS, CSP, X-Frame-Options or CSP frame-ancestors, X-Content-Type-Options), favicon | ✅ |
| **Site files:** `robots.txt` and `sitemap.xml` present (sitemap also found via robots.txt) | ✅ |
| **Accessibility checks (automated):** missing alt text, unlabeled form fields, empty links/buttons, missing `lang` (counted once, not also in SEO) | ✅ |
| JavaScript-only site detection (near-empty page) flags the report as partial | ✅ |
| Platform detection with confidence level: WordPress, Wix, Shopify, Squarespace, Webflow | ✅ |
| **Local business checks (opt-in):** business schema, phone number + tap-to-call link, address, opening hours, Google Maps link or embed | ✅ |
| Evidence on every failed issue, shortened to keep reports small | ✅ |
| Test fixtures per check, per platform, and for local-business pass/fail | ✅ |

## Phase 3: Knowledge base (the report's words) ✅

| Feature | Status |
|---|---|
| One entry per check (46): title, what, why it matters, business impact, how to fix, effort, impact, optional code snippet | ✅ |
| Plain language for owners; technical detail only in snippets and evidence | ✅ |
| Step-by-step fixes per platform for the highest-impact issues (title, search-result summary, alt text, slow images, HTTPS, sitemap) | ✅ |
| Generic fix always available when the platform is unknown | ✅ |
| Fallback entry for unknown PageSpeed findings | ✅ |
| English, French and Arabic versions (Western digits in Arabic) | ✅ |
| Tests: every check has an entry in every language; banned-jargon test per language; platform fixes never replace the generic fix | ✅ |
| French and Arabic reviewed by a fluent speaker | ⏳ |
| Platform menu paths checked against the live platforms | ⏳ |

## Phase 4: PageSpeed Insights (speed test)

| Feature | Status |
|---|---|
| Mobile speed test via Google PageSpeed Insights | ⬜ |
| Reads only what we use: scores, Core Web Vitals (LCP, CLS, INP/TBT, FCP), top opportunities | ⬜ |
| Top 3-5 speed improvements turned into issues | ⬜ |
| PageSpeed accessibility score used as the base accessibility signal | ⬜ |
| Quota errors, timeouts and failures give a partial report, not a crash | ⬜ |
| Tests with saved real responses | ⬜ |

## Phase 5: Orchestrator and scoring

| Feature | Status |
|---|---|
| One `runAudit(url)` that runs the speed test and HTML checks in parallel | ⬜ |
| Merges results and removes duplicates between PageSpeed and our own checks | ⬜ |
| Category scores (start at 100, minus 15 / 7 / 2 per critical / warning / info issue) | ⬜ |
| Overall score: performance 35%, SEO 25%, accessibility 20%, technical 20% | ⬜ |
| Letter grade A-F | ⬜ |
| Issues sorted by severity, then impact and effort | ⬜ |
| Tests for scoring and partial failures | ⬜ |

## Phase 6: Storage and sharing

| Feature | Status |
|---|---|
| Reports saved with a random, unguessable ID and an expiry (default 30 days) | ⬜ |
| Old report versions handled safely (old shared links never crash the page) | ⬜ |
| 1-hour result cache per URL to protect the PageSpeed quota | ⬜ |
| Shareable report page `/report/[id]` with "expires on" notice | ⬜ |
| Friendly page for missing or expired reports | ⬜ |

## Phase 7: API and report UI

| Feature | Status |
|---|---|
| `POST /api/audit` that streams live progress and returns the report ID | ⬜ |
| Landing page: big URL field, one button, "I serve local customers" checkbox, one-page notice, example report link | ⬜ |
| Real loading stages ("Testing mobile speed...", "Checking SEO...") with skeletons | ⬜ |
| Report dashboard: letter grade, overall score, score ring per category, speed metrics in plain words | ⬜ |
| **"Fix these first" card:** top 3 issues by impact, then lowest effort | ⬜ |
| Issue cards: what, why it matters, how to fix, effort and impact badges | ⬜ |
| Collapsible "Developer details" per issue (code snippet, raw evidence) | ⬜ |
| "Technical view" switch that opens all developer details (off by default, remembered) | ⬜ |
| Platform-aware fix steps ("This looks like a WordPress site") with generic fallback | ⬜ |
| **"Send to my developer":** copy-paste technical to-do message, in the current language or English | ⬜ |
| Links from each issue to its guide page | ⬜ |
| Severity shown with icon + text + color (never color only) | ⬜ |
| Banners for partial results, JavaScript-only sites and blocked sites | ⬜ |
| Error states: invalid URL, blocked URL, site unreachable/403, PageSpeed quota, timeout | ⬜ |
| Copy-link button | ⬜ |
| Full Arabic right-to-left pass (layout, icons, rings, progress, forms) | ⬜ |
| Western digits (0-9) in Arabic | ⬜ |
| Dark mode, reduced-motion support, mobile-first layout | ⬜ |
| Keyboard navigation, visible focus, labeled controls, AA contrast | ⬜ |

## Phase 8: Re-scan and compare

| Feature | Status |
|---|---|
| "Re-scan" button (fresh audit, skips the cache, counts toward the rate limit) | ⬜ |
| Compare view: score change per category ("improved from X to Y") | ⬜ |
| Fixed / New / Still open issue lists, with fixed issues celebrated | ⬜ |
| Works gracefully if the previous report has expired | ⬜ |
| Tests for the comparison | ⬜ |

## Phase 9: Hardening

| Feature | Status |
|---|---|
| Rate limit per visitor (5 audits/hour) with "try again in X" message | ⬜ |
| Global daily cap on PageSpeed requests | ⬜ |
| Everything taken from audited sites is escaped before display (XSS safety) | ⬜ |
| Security headers on the app itself | ⬜ |
| Failure logging without sensitive data (Sentry optional) | ⬜ |
| Manual tests: single-page app, Cloudflare-protected site, very slow site, many redirects, non-HTML URL, huge page | ⬜ |

## Phase 10: SEO for the app itself

| Feature | Status |
|---|---|
| Unique title, description, canonical and social tags on every public page | ⬜ |
| `sitemap.xml` (landing + guides, all languages) and `robots.txt` (blocks API and reports) | ⬜ |
| Language alternates (hreflang + x-default) on landing and guides | ⬜ |
| Translated metadata, structured data and social images in all three languages | ⬜ |
| Report pages hidden from search engines (`noindex, nofollow`) | ⬜ |
| Structured data: WebApplication + FAQ on landing; Breadcrumb + Article/HowTo on guides | ⬜ |
| **Guide pages:** one static page per check ("How to fix a missing meta description in WordPress, Wix, Shopify..."), with related guides and a call to action | ⬜ |
| Internal linking: landing → guides, guides ↔ related guides, issue cards → guides | ⬜ |
| Dynamic social preview images for landing and guides | ⬜ |
| Single canonical host (www or apex), custom 404 page | ⬜ |
| Lighthouse 95+ in all categories; structured data validated; Search Console and Bing set up | ⬜ |

## Phase 11: Deploy and polish

| Feature | Status |
|---|---|
| Live on Vercel with env vars and function time limits confirmed | ⬜ |
| Function region next to the Upstash region | ⬜ |
| App audited with itself, and its findings fixed | ⬜ |
| Favicon and social tags for the app | ⬜ |
| Privacy page and short terms in all three languages | ⬜ |
| Example report on the landing page | ⬜ |
| README: what it does, architecture, SSRF approach, scoring, limits, screenshots | ⬜ |

## Phase 12: Sharing and launch

| Feature | Status |
|---|---|
| Share card image with grade, score and rings, in the viewer's language (RTL-safe) | ⬜ |
| Shared report links show the score card on social media | ⬜ |
| "Share my score" buttons for LinkedIn and X (no third-party scripts) + copy link | ⬜ |
| "Checked with [tool]" line on shared reports | ⬜ |
| Domain shown on the share card only if the person chooses | ⬜ |
| Privacy-friendly analytics: audits started/completed, shares, re-scans; UTM tags on shared links | ⬜ |
| Launch materials: demo video, screenshots, posts (LinkedIn, X, Product Hunt, Indie Hackers, dev.to), French and Arabic versions | ⏳ |

---

## Not in the MVP (only if needed later)

| Trigger | Feature |
|---|---|
| Timeouts or heavy load | Background job queue for audits |
| Accounts or history | Database + login |
| Paying users | Payments, scheduled re-audits, PDF export, white-label reports |
| Demand for depth | Multi-page crawl, headless rendering, desktop speed test, competitor comparison |
| Bot abuse | Cloudflare Turnstile |
