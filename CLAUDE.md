# Website Health Checker

> Working title. The final brand name is undecided: keep name, tagline, and site URL in one config file (`lib/siteConfig.ts`) so renaming is a one-line change.

A single-page website audit tool for small business owners. The user enters a URL and gets a plain-language report: what's wrong, why it matters, how to fix it, and what to do first.

**Audience:** business owners first (plain language), with expandable "developer details" for developers and agencies.

## Stack

- Next.js (App Router), React, TypeScript (strict)
- Tailwind CSS + shadcn/ui
- Zod (input validation and report schema)
- Cheerio (HTML analysis)
- Google PageSpeed Insights API, **mobile strategy only**
- Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`) for report storage, result caching, and rate limiting
- next-intl for internationalization (English, French, Arabic with RTL)
- Vitest for tests
- Hosting: Vercel

## MVP scope

**In:** performance (PSI), SEO basics, technical checks, automated accessibility checks, scored report with prioritized issues, shareable report links (expiring).

**Differentiators (also in MVP):** "Fix these first" card, platform detection with tailored fix steps (WordPress, Wix, Shopify, Squarespace, Webflow), "Send to my developer" message generator, optional local business checks, business-impact wording, re-scan and compare, letter grade and score rings, language switcher (English, French, Arabic with RTL support), share card and share buttons.

**Out (do not build yet):** accounts, database, history, monitoring, multi-page crawling, PDF export, desktop PSI, competitor comparison, headless browser rendering.

The tool audits **one URL** (the homepage) plus `robots.txt` and `sitemap.xml`. The UI must say so clearly.

## Architecture

```
Input (Zod) -> URL safety check -> [ PSI fetch || HTML fetch + Cheerio checks ]
-> normalize into Issue[] -> score + prioritize -> save report -> report UI
```

### Folder structure

```
src/
  app/
    [locale]/                 # en | fr | ar (next-intl)
      layout.tsx              # sets lang and dir (rtl for ar)
      page.tsx                # landing + URL form
      report/[id]/page.tsx    # shareable report
      guides/[slug]/page.tsx  # static guide per check
    api/audit/route.ts        # streams progress events (NDJSON), returns report id
  messages/                   # UI strings: en.json, fr.json, ar.json
  i18n/                       # routing, request config, locale helpers
  components/                 # UI (shadcn/ui based)
  lib/
    audit/runAudit.ts         # single orchestrator: runAudit(url) -> Report
    checks/                   # pure functions: html in -> Issue[] out
      seo.ts
      technical.ts
      accessibility.ts
      psi.ts                  # maps PSI response -> Issue[]
    security/
      ssrf.ts                 # URL + IP validation
      safeFetch.ts            # fetch wrapper (timeouts, size cap, redirect re-validation)
    kb/                       # knowledge base: check id -> content, one file per locale
      en.ts
      fr.ts
      ar.ts
    scoring/score.ts
    storage/reports.ts        # saveReport / getReport interface
    storage/redis.ts          # Upstash implementation
    schemas.ts                # Zod schemas (input, Issue, Report)
```

### Core types (in `schemas.ts`)

```ts
type Severity = "critical" | "warning" | "info";
type Category = "performance" | "seo" | "accessibility" | "technical";

type Issue = {
  id: string;              // stable check id, e.g. "seo.title.missing"
  category: Category;
  severity: Severity;
  passed: boolean;
  evidence?: Record<string, unknown>; // raw values: found title, status code, etc.
  tags?: "local"[];        // local-business checks only run when the user opts in
};

type Platform = "wordpress" | "wix" | "shopify" | "squarespace" | "webflow" | "unknown";

type Report = {
  schemaVersion: 1;
  id: string;
  url: string;             // normalized
  createdAt: string;       // ISO
  scores: { overall: number } & Record<Category, number>;
  issues: Issue[];
  partial?: { psiFailed?: boolean; htmlFailed?: boolean; jsShellSuspected?: boolean };
  platform?: { name: Platform; confidence: "high" | "medium" | "low" };
  localChecks: boolean;    // whether the user opted into local business checks
  previousReportId?: string; // set on re-scans, powers the compare view
};
```

The knowledge base joins to `Issue.id` at render time. Each entry:
`{ title, what, why, businessImpact, fix, platformFixes?: Partial<Record<Platform, string>>, effort: "low"|"medium"|"high", impact: "low"|"medium"|"high", snippet?: string }`.
`why` explains the problem in plain words; `businessImpact` states the consequence for the business ("visitors leave before your page loads"), never a raw metric.
`platformFixes` holds step-by-step instructions per platform; fall back to `fix` when the platform is unknown or has no entry.
Checks never contain user-facing copy.

## Conventions

- **Checks are pure functions** (`html in -> Issue[] out`), no I/O, easy to unit test. They must be movable into a queue worker unchanged.
- **One orchestrator**: `runAudit(url)` is called by the API route today and could be called by a queue worker later.
- **Storage behind an interface** (`saveReport`, `getReport`). Only `storage/redis.ts` knows about Upstash.
- **Version the report schema** (`schemaVersion`). Old shared links must not crash the page.
- **Keep content separate from logic**: copy lives only in `kb/issues.ts`.
- **Validate at the edges** with Zod: request input, PSI response (parse only what we use), and stored reports on read.
- **Fail partially, not totally**: if PSI or HTML fetch fails, still return a report with what succeeded and set `partial`.
- **Honest wording**: accessibility is "automated checks", never "WCAG compliant". Never claim certainty we don't have.
- TypeScript strict, no `any`. Server-only code stays out of client components.
- Secrets in env vars only. Commit a `.env.example` with empty placeholders; never commit `.env.local`; never print or log secret values. Variables:
  - `PSI_API_KEY`
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
  - `NEXT_PUBLIC_SITE_URL` (used for `metadataBase`, canonicals, sitemap)
  - `REPORT_TTL_DAYS` (default 30)
  - `AUDITS_PER_HOUR` (default 5) and `PSI_DAILY_CAP` (rate-limit settings)

## Audience and content layers

Primary audience: **non-technical business owners**. Secondary: developers, freelancers, and agencies who use the same report. One product, two layers.

- **Layer 1 (default, owner)**: letter grade, "Fix these first", plain-language What / Why it matters (business impact) / How to fix, and platform-specific steps. **No jargon.** If a technical term (LCP, canonical, CSP, etc.) is unavoidable, explain it in one plain sentence or move it to Layer 2.
- **Layer 2 (collapsed, developer)**: "Developer details" per issue: code snippet, raw evidence, metric values (Core Web Vitals), and technical notes.
- **Bridge**: "Send to my developer" converts the owner's report into a technical to-do message, so one report serves both audiences.
- **Technical view toggle**: a single switch on the report page that expands all developer details at once and persists the choice per viewer (localStorage, wrapped in try/catch). Default is off.
- **Rule for copy**: anything in `title`, `what`, `why`, `businessImpact`, or `fix` is Layer 1 and must pass the jargon test below. Technical content belongs only in `snippet` and `evidence`.
- **Jargon test**: write a short word list (e.g. LCP, CLS, TBT, canonical, hreflang, CSP, HSTS, DOM, render-blocking) and assert in a unit test that none of these appear in Layer 1 fields of `kb/issues.ts`.

## Internationalization (English, French, Arabic)

A language switcher (EN / FR / AR) in the header translates the whole app. Set this up from Phase 0; retrofitting i18n later is painful.

- **Library**: `next-intl` with locale-prefixed routes (`/en`, `/fr`, `/ar`). Language lives in the URL (good for SEO and sharing), not only in a cookie.
- **Default language**: detect from `Accept-Language` on the first visit only, then respect the user's choice (remembered in a cookie). Never force-redirect search engine crawlers; each locale URL must be reachable directly.
- **Switcher**: shows language names in their own language (English, Francais, العربية), keeps the user on the same page when switching, and works on report pages too.
- **RTL for Arabic**: set `<html lang="ar" dir="rtl">`. Use Tailwind **logical utilities** everywhere (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `start-0`) instead of `left`/`right`. Flip directional icons (arrows, chevrons). Test every screen in RTL.
- **Fonts**: load an Arabic-capable font with `next/font` (e.g. Noto Sans Arabic or Cairo) next to the Latin font; subset it to keep it light.
- **Numbers**: use Western digits (0-9) in Arabic via `numberingSystem: "latn"`. Keep the letter grade as A-F in all languages.
- **What gets translated**: UI strings (`messages/*.json`), knowledge base content (`kb/en.ts`, `fr.ts`, `ar.ts`), guide pages, metadata (title, description, OG), error messages, the "Send to my developer" message (defaults to the current language, with an English option for developers), and share cards.
- **What does not get translated**: issue ids, raw evidence, code snippets, and URLs. Platform menu names in `platformFixes` keep the platform's English label in parentheses when its UI language is unknown.
- **Reports are language-neutral**: a stored report holds only `Issue[]` and scores. Content is joined from the knowledge base at render time, so switching language on an existing report works instantly with no re-audit and no extra storage.
- **Quality**: machine-translated drafts are fine as a start, but a fluent speaker must review French and Arabic before launch. Write in simple, everyday language in all three.
- **Enforced by tests**: every locale has an entry for every check id; the jargon test runs per locale; every message key exists in all three message files.

## Design principles

Goal: modern, calm, and instantly understandable for non-technical owners.

- **Hero with one job**: big URL field, one button, no signup. A short line stating it audits one page.
- **Letter grade + score rings**: overall grade (A 90+, B 80-89, C 70-79, D 60-69, F below 60) and a ring gauge per category. Show whole numbers only.
- **"Fix these first" card at the top of every report**: the 3 failed issues with highest impact and lowest effort (sort by impact desc, then effort asc). This is the main anti-overwhelm feature.
- **Progressive disclosure**: issue cards show Title, Why it matters, How to fix; "Developer details" (snippet, evidence) is collapsed by default.
- **Severity is never color-only**: icon + text label + color.
- **Real loading stages** with skeletons ("Testing mobile speed...", "Checking SEO...") driven by the streamed progress events.
- **Business-impact wording** everywhere in the main layer; metrics live in developer details.
- **Visual language**: shadcn/ui theme tokens, one accent color, generous spacing, rounded cards, subtle motion that respects `prefers-reduced-motion`, dark mode (`next-themes`), mobile-first layout.
- **States are designed, not afterthoughts**: empty, loading, partial, error, expired report.
- **The app must pass its own audit**: AA contrast, keyboard navigation, visible focus, labeled controls.
- **Trust signals**: free, no signup, honest limits ("automated checks, not a full audit"), report expiry shown.

## Differentiation features (behavior rules)

- **Platform detection**: detect from HTML and response headers using several signals per platform (e.g. `/wp-content/` and generator meta for WordPress; `static.wixstatic.com` for Wix; `cdn.shopify.com` for Shopify; `static1.squarespace.com` for Squarespace; `data-wf-site` for Webflow). Return a confidence level. Wording must be hedged ("This looks like a WordPress site"). Unknown platform falls back to generic fixes.
- **Local business checks** (opt-in via a "I serve local customers" checkbox, off by default): LocalBusiness JSON-LD, visible phone number and `tel:` link, address (schema or `<address>`), opening hours in schema, Google Maps link or embed. These are tagged `local`, only added when opted in, and kept out of the score when the box is unchecked.
- **Send to my developer**: client-side generator that turns failed issues into a copy-paste message (site URL, date, grouped by priority, technical wording, snippets and evidence). No server call, no AI dependency.
- **Re-scan and compare**: "Re-scan" runs a fresh audit (bypasses the cache) for the same URL, links it via `previousReportId`, and shows score deltas per category plus Fixed / New / Still open issues (matched by issue id). Re-scans count against the rate limit.

## SEO for the app itself (extremely optimized)

This tool tells people how to fix their SEO, so it must be a flawless example. Use Next.js features fully.

- **Rendering**: landing page and guide pages are static (SSG) or ISR, never client-rendered. Report pages are dynamic.
- **Metadata API**: every public page exports `metadata` or `generateMetadata` with a unique `title` (under about 60 chars), `description` (about 150 chars), canonical URL (`alternates.canonical`), Open Graph, and Twitter card. Set `metadataBase` once in the root layout from an env var (`NEXT_PUBLIC_SITE_URL`).
- **Report pages are `noindex, nofollow`** (`robots` in `generateMetadata`). They are unguessable user-generated snapshots of third-party sites and expire. Never include them in the sitemap.
- **`app/sitemap.ts` and `app/robots.ts`**: sitemap lists only the landing page and guide pages (every locale version); robots allows public pages and disallows `/api/` and the report paths (`/en/report/`, `/fr/report/`, `/ar/report/`).
- **Multilingual SEO**: each page declares `alternates.languages` (hreflang for `en`, `fr`, `ar`, plus `x-default`) and a self-referencing canonical per locale. Metadata, JSON-LD, and OG images are translated. Never serve mixed-language pages.
- **Structured data (JSON-LD)**: `WebApplication` schema on the landing page, `FAQPage` for the FAQ section, `BreadcrumbList` and `Article`/`HowTo` on guides. Render via a small typed `<JsonLd />` component and validate with Google's Rich Results Test.
- **Programmatic content from the knowledge base**: generate a static guide page per check from `kb/issues.ts` (e.g. `/guides/missing-meta-description`, "How to fix a missing meta description in WordPress, Wix, Shopify..."). Use `generateStaticParams`. Each page reuses the KB content (what, why, fix, platform fixes), links to related guides, and has a CTA to run the audit. This targets exactly what small business owners search for.
- **Landing page content**: one `<h1>`, logical heading hierarchy, real copy (what the tool checks, how it works, who it's for, FAQ). Avoid thin pages and avoid duplicate content between guides (each needs unique intro and context).
- **Internal linking**: landing links to guides, guides link to related guides and back to the tool. Report issue cards link to the matching guide.
- **Performance is SEO**: `next/font` (no layout shift), `next/image` for all images, minimal client JS (keep the report UI client components small, server components by default), no heavy libraries on the landing page. Target Lighthouse 95+ on all four categories and green Core Web Vitals.
- **Social previews**: dynamic Open Graph image via `opengraph-image.tsx` for the landing page and guides.
- **Semantics and accessibility**: semantic landmarks (`header`, `main`, `nav`, `footer`), descriptive link text, alt text, `lang` on `<html>`.
- **Technical hygiene**: HTTPS only, one canonical host (redirect `www` or apex), clean lowercase URLs, a real 404 page, no broken links.
- **Verification**: connect Google Search Console and Bing Webmaster Tools, submit the sitemap, and run the app through its own audit before launch.

## Security rules (non-negotiable)

Server-side fetching of user-supplied URLs is an SSRF risk.

- Allow only `http:` and `https:`; reject credentials in URLs and non-standard ports unless explicitly allowed.
- Resolve the hostname (`dns.lookup` with `all: true`) and reject if **any** address is private/reserved: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16` (cloud metadata), `0.0.0.0/8`, `::1`, `fc00::/7`, `fe80::/10`, and IPv4-mapped IPv6.
- Handle redirects manually (`redirect: "manual"`), max 5 hops, **re-validate every hop**.
- Pin the resolved IP for the actual connection where possible (custom undici `Agent` lookup) to reduce DNS-rebinding risk.
- Timeout (about 10s), response size cap (about 2 MB), and only parse `text/html` responses.
- Send an honest `User-Agent` that names the tool and links to its site. Fetch only the homepage, `robots.txt`, and `sitemap.xml`; never crawl.
- Never return raw upstream error bodies to the client.
- Escape or sanitize all evidence rendered in the UI (titles, meta values come from untrusted sites).

## Scoring (tunable, keep explainable)

- Category score starts at 100; subtract penalties per failed issue: critical -15, warning -7, info -2 (floor 0). Performance uses the PSI performance score directly.
- Overall = weighted average: performance 35%, seo 25%, accessibility 20%, technical 20%.
- Unit test scoring with fixed fixtures. Do not show false precision in the UI (whole numbers only).

## Storage and limits

- Report key: `report:{id}` with a random, unguessable id (12+ chars), TTL from `REPORT_TTL_DAYS` (default 30). UI states the expiry.
- Cache key: `cache:{sha256(normalizedUrl + localChecks flag)}`, short TTL (1h) to protect PSI quota. Do **not** include the language in the key: reports are language-neutral.
- Rate limit: sliding window per IP (start with 5 audits/hour), plus a global daily cap to protect PSI quota.

## How to work with this file in Claude Code

- Work **one phase at a time**. Ask Claude to propose a short plan before coding each phase.
- Tick the checkboxes as items are finished and verified.
- Commit at the end of each phase. A phase is done only when its **Done when** line is true.

### Working rules for Claude Code

- Plan first, wait for approval, then implement. One phase at a time.
- Before using Next.js, next-intl, shadcn/ui, Upstash, or PSI APIs, check the current official docs for the **installed versions**. Do not rely on memory; file conventions and APIs change.
- Do not install packages that are not listed in this file without asking.
- Never print, log, or commit secret values. Only edit `.env.example` with empty placeholders.
- No hardcoded UI text (use next-intl messages) and no `left`/`right` Tailwind utilities (use logical ones).
- Run typecheck, lint, and tests before saying a phase is done.
- If this file conflicts with itself or with reality, say so instead of silently deviating.
- Keep answers short and actionable.

---

## Phase 0: Project setup

- [x] Create Next.js app (App Router, TypeScript, Tailwind, ESLint)
- [x] Initialize shadcn/ui; add `button`, `input`, `card`, `badge`, `accordion`, `skeleton`, `alert`
- [x] Install `zod`, `cheerio`, `@upstash/redis`, `@upstash/ratelimit`, `vitest`, `next-intl`
- [x] Set up `next-intl`: `[locale]` routing for `en`, `fr`, `ar`; messages files; `lang` and `dir` set per locale
- [x] Load Latin and Arabic fonts with `next/font`; use Tailwind logical utilities from day one
- [x] Test a trivial page in all three languages, including RTL
- [x] Exclude `/api` and static assets from the next-intl routing matcher (the audit API must not be locale-prefixed)
- [x] Confirm `.env.local` is in `.gitignore`
- [x] Add `.env.example` and `.env.local` (not committed)
- [x] Add scripts: `test`, `typecheck`, `lint`
- [x] Create the folder structure above
- [ ] Get a PageSpeed Insights API key (Google Cloud Console), restricted to the PSI API
- [ ] Create a free Upstash Redis database (needed from Phase 6); fill `.env.local`
- [x] Create `lib/siteConfig.ts` (name, tagline, URL) and use it everywhere instead of hardcoding the brand

**Done when:** app runs locally, `npm run typecheck` and `npm test` pass on an empty suite.

## Phase 1: Input validation and safe fetching

- [x] Zod schema for URL input; normalize (add `https://` if missing, strip fragment, lowercase host)
- [x] `ssrf.ts`: scheme check, DNS resolution, private/reserved IP blocklist (IPv4 + IPv6)
- [x] `safeFetch.ts`: timeout, size cap, manual redirects with re-validation, max hops
- [x] Unit tests: localhost, `127.0.0.1`, `10.x`, `169.254.169.254`, IPv6 loopback, `file://`, redirect to a private IP, credentials in URL
- [x] Friendly error messages for each failure type (invalid URL, blocked, timeout, not HTML, too large)

**Done when:** all SSRF test cases are rejected and a normal public site fetches successfully.

## Phase 2: Core model and HTML checks

- [ ] Define `Issue`, `Report`, `Category`, `Severity` Zod schemas in `schemas.ts`
- [ ] SEO checks: title (missing/too short/too long), meta description, H1 (missing/multiple), heading order, canonical, `lang`, viewport, Open Graph basics, robots meta (noindex), image alt text
- [ ] Technical checks: HTTPS, final status code, redirect chain length, mixed content, security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options), favicon
- [ ] Site files: `robots.txt` and `sitemap.xml` presence
- [ ] Accessibility checks (Cheerio): missing alt, unlabeled inputs, empty links/buttons, missing `lang`
- [ ] JS-shell detection (near-empty body, no title/H1, framework root only) sets `partial.jsShellSuspected`
- [ ] `detectPlatform(html, headers)` returns `{ name, confidence }` using multiple signals per platform (WordPress, Wix, Shopify, Squarespace, Webflow)
- [ ] Local business checks (tagged `local`): LocalBusiness JSON-LD, phone + `tel:` link, address, opening hours, Maps link/embed
- [ ] Fixtures for each platform and for local-business pass/fail cases
- [ ] Unit tests with small HTML fixtures (pass and fail cases per check)

**Done when:** each check returns correct `Issue[]` on fixtures, with evidence values filled in.

## Phase 3: Knowledge base

- [ ] `kb/issues.ts` typed against the check ids
- [ ] For every check id: `title`, `what`, `why`, `fix`, `effort`, `impact`, optional `snippet`
- [ ] Plain-language tone (no jargon in `what`/`why`; technical detail only in `snippet`)
- [ ] Test: every check id has a KB entry (fails the build if one is missing)
- [ ] Jargon test: banned-terms list must not appear in Layer 1 fields (`title`, `what`, `why`, `businessImpact`, `fix`)
- [ ] Write the English KB first, then French and Arabic versions (`kb/fr.ts`, `kb/ar.ts`) typed against the same check ids
- [ ] Test: every locale has an entry for every check id; jargon test runs for each locale
- [ ] Have French and Arabic copy reviewed by a fluent speaker
- [ ] Fallback entry for unknown PSI audit ids
- [ ] `businessImpact` written for every entry (consequence for the business, not a metric)
- [ ] `platformFixes` for the highest-impact issues (title, meta description, image alt text, slow images, HTTPS, sitemap) on WordPress, Wix, Shopify, Squarespace, Webflow
- [ ] Test: platform fix text never replaces the generic `fix` (fallback must always work)

**Done when:** the "every id has an entry" test passes.

## Phase 4: PageSpeed Insights integration

- [ ] `psi.ts` client: `strategy=mobile`, categories `performance`, `accessibility`, `seo`, `best-practices`
- [ ] Zod-parse only the fields we use (scores, Core Web Vitals: LCP, CLS, INP/TBT, FCP, top opportunities)
- [ ] Map PSI audits to `Issue[]` (limit to the top 3-5 performance opportunities)
- [ ] Use the PSI accessibility score as the base accessibility signal
- [ ] Handle quota errors, timeouts, and non-200 responses with a `partial` result
- [ ] Mock PSI responses in tests (save 1-2 real responses as fixtures)

**Done when:** a real URL returns normalized issues and Core Web Vitals; failures degrade gracefully.

## Phase 5: Orchestrator and scoring

- [ ] `runAudit(url)`: validate, run PSI and HTML pipeline **in parallel** (`Promise.allSettled`)
- [ ] Merge into one `Issue[]`; dedupe overlapping findings (PSI vs Cheerio)
- [ ] `score.ts`: category scores, overall score, severity-based prioritization
- [ ] Sort issues by severity, then impact/effort
- [ ] Tests for scoring and for partial-failure cases

**Done when:** `runAudit` returns a valid `Report` for a real site, and a report with only one source succeeded.

## Phase 6: Storage and sharing

- [ ] `storage/reports.ts` interface + Upstash implementation
- [ ] Generate random report id; save with TTL
- [ ] `getReport` validates with Zod and handles unknown `schemaVersion`
- [ ] URL-hash result cache (1h) to protect PSI quota
- [ ] `/report/[id]` page: loads report, 404 state for missing/expired, "expires on" notice

**Done when:** an audit produces a link that opens the same report in another browser, and expired/missing ids show a friendly page.

## Phase 7: API route and report UI

- [ ] `POST /api/audit`: validate, run audit, stream progress events (NDJSON), return report id; set `maxDuration`
- [ ] Landing page: URL form, "I serve local customers" checkbox, single-page-audit notice, example report link
- [ ] Loading state with real stages (checking performance, SEO, accessibility...)
- [ ] Report dashboard: letter grade, overall score, score rings per category, Core Web Vitals (in plain words), issues grouped by priority
- [ ] "Fix these first" card (top 3 by impact desc, effort asc)
- [ ] Issue cards: What / Why it matters (with business impact) / How to fix, effort and impact badges, collapsible "developer details" (snippet and evidence)
- [ ] Platform-aware fix steps with a "Looks like WordPress" note and a generic-fix fallback
- [ ] "Send to my developer" button: generates and copies a grouped technical message client-side (current language, with an English option)
- [ ] "Technical view" toggle that expands all developer details (off by default, remembered per viewer)
- [ ] Language switcher (EN / FR / AR) in the header; stays on the same page; works on report pages
- [ ] All UI strings come from `messages/*.json` (no hardcoded text); report content comes from the locale's KB
- [ ] Full RTL pass: layout, icons, score rings, progress stages, forms, and the compare view in Arabic
- [ ] Dark mode, reduced-motion support, mobile-first layout
- [ ] Banners for partial results, JS-rendered sites, and blocked sites
- [ ] Error states: invalid URL, blocked URL, site unreachable/403, PSI quota, timeout
- [ ] Copy-link button; responsive layout; keyboard navigation and focus states (the tool must pass its own accessibility checks)

**Done when:** full flow works end to end locally, including every error state.

## Phase 8: Re-scan and compare

- [ ] "Re-scan" button on the report page; fresh audit bypassing the cache, saved with `previousReportId`
- [ ] `compareReports(previous, current)`: score deltas per category, issue lists Fixed / New / Still open (by issue id)
- [ ] Compare view: "Score improved from X to Y", fixed issues celebrated, remaining issues listed
- [ ] Handle missing/expired previous report gracefully (show the new report without comparison)
- [ ] Unit tests for `compareReports` with fixtures

**Done when:** fixing something on a test site and re-scanning shows the improvement and the fixed issue.

## Phase 9: Hardening

- [ ] Rate limiting per IP (Upstash Ratelimit) with a clear "try again in X" message
- [ ] Global daily cap for PSI requests
- [ ] Audit all rendered evidence for XSS safety
- [ ] Add security headers to the app itself
- [ ] Basic logging for failures (no sensitive data); optional Sentry
- [ ] Manual test set: SPA site, site behind Cloudflare, very slow site, redirect-heavy site, non-HTML URL, huge page

**Done when:** abuse attempts are blocked and every manual test case gives a clean result or a clear message.

## Phase 10: SEO optimization

- [ ] Root layout: `metadataBase`, default title template, default OG/Twitter metadata, `lang` set
- [ ] Landing page: unique title, description, canonical, single `<h1>`, real copy sections, FAQ
- [ ] `app/sitemap.ts` (landing + guides only, all locales) and `app/robots.ts` (disallow `/api/` and report paths for every locale)
- [ ] hreflang (`alternates.languages` with `x-default`) and per-locale canonicals on landing and guides
- [ ] Translated metadata, JSON-LD, and OG images for `en`, `fr`, `ar`; verify Arabic text renders correctly in OG images
- [ ] `/report/[id]`: `noindex, nofollow` via `generateMetadata`; confirmed absent from the sitemap
- [ ] Typed `<JsonLd />` component; `WebApplication` + `FAQPage` on landing; `BreadcrumbList` + `Article`/`HowTo` on guides
- [ ] `/guides/[slug]` generated from `kb/issues.ts` with `generateStaticParams` (one page per check, platform-specific sections, related guides, audit CTA)
- [ ] Internal links: landing -> guides, guides <-> related guides, issue cards -> matching guide
- [ ] Dynamic OG images (`opengraph-image.tsx`) for landing and guides
- [ ] `next/font` and `next/image` everywhere; check bundle size of public pages
- [ ] Redirect `www`/apex to one canonical host; custom 404 page
- [ ] Validate structured data (Rich Results Test), check Search Console, submit sitemap
- [ ] Lighthouse 95+ on all categories for landing and one guide page

**Done when:** the app passes its own audit with no critical or warning issues and structured data validates.

## Phase 11: Deploy and polish

- [ ] Deploy to Vercel; set env vars; confirm function `maxDuration` works on your plan
- [ ] Run the tool against your own site and fix what it reports
- [ ] Open Graph tags and favicon for the app itself
- [ ] Privacy page and short terms in all three languages: what is stored (reports for 30 days), no accounts, analytics used, language cookie
- [ ] Choose the Vercel function region closest to the Upstash region
- [ ] README: what it does, architecture diagram, SSRF approach, scoring explanation, limitations, screenshots
- [ ] Add an example report to the landing page
- [ ] Lighthouse check on the app (target 90+ in all categories)

**Done when:** it's live, you've audited real sites with it, and the README explains the design decisions.

---

## Phase 12: Sharing and launch

Build the sharing features first, then run the launch checklist.

**Sharing features**
- [ ] Share card: generated image (via `opengraph-image` or `ImageResponse`) showing letter grade, score, and category rings, in the viewer's language (RTL-safe for Arabic)
- [ ] Report pages keep proper Open Graph and Twitter tags so shared links show the score card (OG tags work even with `noindex`)
- [ ] "Share my score" buttons for LinkedIn and X using plain share URLs (no third-party SDKs), plus copy-link
- [ ] Small "Checked with [YourTool]" line with a link on shared reports
- [ ] Privacy-friendly analytics (Vercel Analytics or Plausible) and UTM parameters on shared links; track: audits started, audits completed, shares, re-scans
- [ ] The share card shows the domain only if the person chose to share

**Launch checklist**
- [ ] Demo video (30-60 seconds) and 3-4 clean screenshots
- [ ] Landing page example report and a short "how it works" section
- [ ] LinkedIn launch post and a short build-in-public story (what you built, why, what you learned)
- [ ] X thread with screenshots
- [ ] Product Hunt, Indie Hackers, and dev.to posts
- [ ] Reddit and Facebook groups: read each group's rules first; give value first, mention the tool only where allowed
- [ ] Content series: "I scanned 50 websites" with **aggregate results only** (do not name specific sites)
- [ ] Before-and-after case study on a real site (your own or a consenting friend or client)
- [ ] Free-audit offer post ("send me your website") for finding freelance clients
- [ ] Publish French and Arabic versions of the main posts for the Tunisian and North African market
- [ ] Weekly posting rhythm on two platforms (start with LinkedIn and X)

**Done when:** a shared report shows a correct preview card on LinkedIn and X in all three languages, analytics track the main events, and the launch posts are published.

---

## Post-MVP backlog (do only when triggered)

| Trigger | Change |
|---|---|
| Timeouts or heavy load | Async audits with a job queue (Inngest, QStash, or Trigger.dev) |
| Accounts or history | Postgres (Prisma) + auth (Auth.js or Clerk) |
| Paying users | Stripe, scheduled re-audits, PDF export, white-label reports for agencies |
| Demand for depth | Multi-page crawl, headless rendering service, desktop PSI toggle, competitor comparison |
| Bot abuse | Cloudflare Turnstile |
