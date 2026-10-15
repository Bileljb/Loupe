import type { KbSharedTable } from "./types";

const titleSnippet = `<title>Rosa's Bakery: fresh bread in Lyon</title>`;
const descriptionSnippet = `<meta name="description" content="Family bakery in central Lyon: sourdough, croissants and celebration cakes, baked every morning. Order online or visit us.">`;
const h1Snippet = `<h1>Fresh bread, baked every morning in Lyon</h1>`;

export const shared = {
  "seo.title.missing": { effort: "low", impact: "high", snippet: titleSnippet },
  "seo.title.too-short": { effort: "low", impact: "medium", snippet: titleSnippet },
  "seo.title.too-long": { effort: "low", impact: "low", snippet: titleSnippet },
  "seo.meta-description.missing": { effort: "low", impact: "medium", snippet: descriptionSnippet },
  "seo.meta-description.too-short": { effort: "low", impact: "low", snippet: descriptionSnippet },
  "seo.meta-description.too-long": { effort: "low", impact: "low", snippet: descriptionSnippet },
  "seo.h1.missing": { effort: "low", impact: "medium", snippet: h1Snippet },
  "seo.h1.multiple": { effort: "low", impact: "low", snippet: `${h1Snippet}\n<h2>Our breads</h2>\n<h2>Visit us</h2>` },
  "seo.headings.skipped-level": {
    effort: "low",
    impact: "low",
    snippet: `<h1>Rosa's Bakery</h1>\n  <h2>Our breads</h2>\n    <h3>Sourdough</h3>\n  <h2>Visit us</h2>`,
  },
  "seo.canonical.missing": {
    effort: "low",
    impact: "low",
    snippet: `<link rel="canonical" href="https://www.example.com/">`,
  },
  "seo.viewport.missing": {
    effort: "low",
    impact: "high",
    snippet: `<meta name="viewport" content="width=device-width, initial-scale=1">`,
  },
  "seo.open-graph.incomplete": {
    effort: "low",
    impact: "low",
    snippet: [
      `<meta property="og:title" content="Rosa's Bakery">`,
      `<meta property="og:description" content="Fresh bread, baked every morning in Lyon.">`,
      `<meta property="og:image" content="https://www.example.com/share-1200x630.jpg">`,
    ].join("\n"),
  },
  "seo.noindex": {
    effort: "low",
    impact: "high",
    snippet: `<!-- Remove this tag -->\n<meta name="robots" content="noindex">\n\n# ...and this response header, if your server sends it\nX-Robots-Tag: noindex`,
  },

  "technical.https.missing": {
    effort: "medium",
    impact: "high",
    snippet: [
      "# Example: redirect all HTTP traffic to HTTPS (Apache .htaccess)",
      "RewriteEngine On",
      "RewriteCond %{HTTPS} off",
      "RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]",
    ].join("\n"),
  },
  "technical.status.error": { effort: "medium", impact: "high" },
  "technical.redirects.too-many": {
    effort: "low",
    impact: "medium",
    snippet: "# Redirect every variant straight to the final URL in one hop:\nhttp://example.com/      -> 301 -> https://www.example.com/\nhttp://www.example.com/  -> 301 -> https://www.example.com/\nhttps://example.com/     -> 301 -> https://www.example.com/",
  },
  "technical.mixed-content": {
    effort: "low",
    impact: "medium",
    snippet: `<!-- Before -->\n<img src="http://www.example.com/photo.jpg">\n<!-- After -->\n<img src="https://www.example.com/photo.jpg">`,
  },
  "technical.headers.hsts.missing": {
    effort: "low",
    impact: "low",
    snippet: "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  },
  "technical.headers.csp.missing": {
    effort: "high",
    impact: "low",
    snippet: "# Start in report-only mode, check nothing breaks, then switch to enforcing:\nContent-Security-Policy-Report-Only: default-src 'self'; img-src 'self' https: data:; frame-ancestors 'self'",
  },
  "technical.headers.frame-options.missing": {
    effort: "low",
    impact: "low",
    snippet: "X-Frame-Options: SAMEORIGIN\n# or, if you use a Content-Security-Policy:\nContent-Security-Policy: frame-ancestors 'self'",
  },
  "technical.headers.content-type-options.missing": {
    effort: "low",
    impact: "low",
    snippet: "X-Content-Type-Options: nosniff",
  },
  "technical.favicon.missing": {
    effort: "low",
    impact: "low",
    snippet: [
      `<link rel="icon" href="/favicon.ico" sizes="any">`,
      `<link rel="icon" href="/icon.svg" type="image/svg+xml">`,
      `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`,
    ].join("\n"),
  },
  "technical.robots-txt.missing": {
    effort: "low",
    impact: "low",
    snippet: "# /robots.txt\nUser-agent: *\nAllow: /\n\nSitemap: https://www.example.com/sitemap.xml",
  },
  "technical.sitemap.missing": {
    effort: "low",
    impact: "medium",
    snippet: [
      `<?xml version="1.0" encoding="UTF-8"?>`,
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
      `  <url><loc>https://www.example.com/</loc></url>`,
      `  <url><loc>https://www.example.com/contact</loc></url>`,
      `</urlset>`,
    ].join("\n"),
  },

  "accessibility.img-alt.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<img src="cake.jpg" alt="Chocolate birthday cake with candles">\n<!-- Decorative images get an empty alt -->\n<img src="divider.png" alt="">`,
  },
  "accessibility.form-label.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<label for="email">Email address</label>\n<input id="email" type="email" name="email" autocomplete="email">`,
  },
  "accessibility.link-name.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<a href="https://instagram.com/rosasbakery" aria-label="Instagram">\n  <svg aria-hidden="true">…</svg>\n</a>`,
  },
  "accessibility.button-name.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<button type="button" aria-label="Close menu">\n  <svg aria-hidden="true">…</svg>\n</button>`,
  },
  "accessibility.lang.missing": {
    effort: "low",
    impact: "low",
    snippet: `<html lang="en">  <!-- "fr" for French, "ar" with dir="rtl" for Arabic -->`,
  },

  "performance.lcp.slow": {
    effort: "medium",
    impact: "high",
    snippet: `<!-- Main image: right-sized, modern format, loaded first, never lazy -->\n<img src="hero-1200.webp" width="1200" height="600" fetchpriority="high" alt="…">`,
  },
  "performance.cls.high": {
    effort: "medium",
    impact: "medium",
    snippet: `<!-- Always give images and embeds a width and height (or aspect-ratio) -->\n<img src="photo.jpg" width="800" height="600" alt="…">`,
  },
  "performance.interactivity.slow": { effort: "medium", impact: "medium" },
  "performance.first-paint.slow": { effort: "medium", impact: "medium" },
  "performance.server.slow": { effort: "medium", impact: "high" },
  "performance.images.unoptimized": {
    effort: "low",
    impact: "high",
    snippet: `<img src="photo-800.webp"\n     srcset="photo-400.webp 400w, photo-800.webp 800w, photo-1600.webp 1600w"\n     sizes="(max-width: 600px) 100vw, 800px"\n     width="800" height="600" loading="lazy" alt="…">`,
  },
  "performance.render-blocking": {
    effort: "medium",
    impact: "medium",
    snippet: `<!-- Load non-critical scripts without blocking the first render -->\n<script src="/widget.js" defer></script>`,
  },
  "performance.unused-code": { effort: "medium", impact: "medium" },
  "performance.text-compression": {
    effort: "low",
    impact: "medium",
    snippet: "# Example (nginx)\ngzip on;\ngzip_types text/css application/javascript application/json image/svg+xml;",
  },
  "performance.caching": {
    effort: "low",
    impact: "low",
    snippet: "# For versioned static files (images, CSS, JS)\nCache-Control: public, max-age=31536000, immutable",
  },
  "performance.other": { effort: "medium", impact: "low" },

  "local.schema.missing": {
    effort: "medium",
    impact: "high",
    snippet: [
      `<script type="application/ld+json">`,
      `{`,
      `  "@context": "https://schema.org",`,
      `  "@type": "Bakery",`,
      `  "name": "Rosa's Bakery",`,
      `  "telephone": "+33 4 78 00 00 00",`,
      `  "address": {`,
      `    "@type": "PostalAddress",`,
      `    "streetAddress": "12 rue de la République",`,
      `    "addressLocality": "Lyon",`,
      `    "postalCode": "69002",`,
      `    "addressCountry": "FR"`,
      `  },`,
      `  "openingHours": "Tu-Su 07:00-19:00"`,
      `}`,
      `</script>`,
    ].join("\n"),
  },
  "local.phone.missing": { effort: "low", impact: "high", snippet: `<a href="tel:+33478000000">04 78 00 00 00</a>` },
  "local.address.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<address>12 rue de la République, 69002 Lyon, France</address>`,
  },
  "local.hours.missing": {
    effort: "low",
    impact: "medium",
    snippet: `"openingHoursSpecification": [\n  { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "07:00", "closes": "19:00" }\n]`,
  },
  "local.map.missing": {
    effort: "low",
    impact: "medium",
    snippet: `<a href="https://www.google.com/maps/search/?api=1&query=Rosa%27s+Bakery+Lyon">Get directions</a>`,
  },
} satisfies KbSharedTable;
