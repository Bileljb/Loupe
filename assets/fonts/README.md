# Fonts for generated images

Used only by Open Graph images (`src/lib/og.tsx`); the site itself loads fonts with `next/font`.

| File | Source | License |
|---|---|---|
| `Geist-Regular.ttf` | Bundled with Next.js (`next/dist/compiled/@vercel/og`) | SIL OFL 1.1 (`OFL-Geist.txt`) |
| `IBMPlexSansArabic-Bold.ttf` | github.com/google/fonts (`ofl/ibmplexsansarabic`) | SIL OFL 1.1 (`OFL-IBMPlexSansArabic.txt`) |

The OG renderer can't parse Noto Sans/Naskh Arabic (unsupported GSUB lookup type 5, format 3).
IBM Plex Sans Arabic parses and shapes correctly. The renderer's bidi handling is unreliable, so
`og.tsx` lays out RTL text word by word.
