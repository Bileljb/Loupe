import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CSSProperties } from "react";
import { ImageResponse } from "next/og";
import { getDirection, type AppLocale } from "@/i18n/routing";
import { siteConfig } from "@/lib/siteConfig";

export const ogSize = { width: 1200, height: 630 };

// Read once per server instance. Passing fonts replaces the renderer's default, so Latin needs one too.
// See assets/fonts/README.md for why the Arabic font is IBM Plex Sans Arabic.
const fonts = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Geist-Regular.ttf")),
  readFile(join(process.cwd(), "assets/fonts/IBMPlexSansArabic-Bold.ttf")),
]);

type OgContent = { locale: AppLocale; eyebrow: string; title: string; footer: string };

/**
 * Text that reads correctly in both directions. The renderer shapes Arabic letters correctly but
 * its bidi handling moves spaces between words, so RTL text is laid out one word per box in a
 * right-to-left wrapping row: word order and spacing are then correct by construction.
 */
function Text({ text, rtl, style }: { text: string; rtl: boolean; style: CSSProperties }) {
  if (!rtl) return <div style={{ display: "flex", ...style }}>{text}</div>;
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexDirection: "row-reverse", flexWrap: "wrap", columnGap: "0.28em", ...style }}>
      {words.map((word, index) => (
        <span key={index}>{word}</span>
      ))}
    </div>
  );
}

/** The shared social card: brand, a small label, a big title, and a footer line. */
export async function renderOgImage({ locale, eyebrow, title, footer }: OgContent): Promise<ImageResponse> {
  const [latin, arabic] = await fonts;
  const rtl = getDirection(locale) === "rtl";
  const align = rtl ? "flex-end" : "flex-start";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: align,
          padding: 72,
          color: "#f4f6ff",
          fontFamily: "Geist, IBM Plex Sans Arabic",
          backgroundColor: "#0c1020",
          // Glow + faint grid, matching the site's hero.
          backgroundImage: [
            "radial-gradient(ellipse 60% 70% at 85% 0%, rgba(110,130,255,0.45), transparent 70%)",
            "radial-gradient(ellipse 50% 60% at 0% 100%, rgba(80,110,255,0.18), transparent 70%)",
            "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px)",
            "linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
          ].join(", "),
          backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        }}
      >
        <div style={{ display: "flex", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 16 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#8aa4ff" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            <circle cx="14" cy="14" r="9.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="3" />
            <path d="M14 4.5a9.5 9.5 0 0 1 9.2 11.9" fill="none" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" />
            <path d="M21.2 21.2 27 27" stroke="#f4f6ff" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 24, width: "100%" }}>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 999,
              border: "1px solid rgba(160,180,255,0.35)",
              backgroundColor: "rgba(120,140,255,0.12)",
            }}
          >
            <Text text={eyebrow} rtl={rtl} style={{ fontSize: 26, color: "#b9c8ff" }} />
          </div>
          <Text text={title} rtl={rtl} style={{ fontSize: 66, lineHeight: 1.2, fontWeight: 700, maxWidth: 1056, letterSpacing: rtl ? 0 : -1.5 }} />
        </div>
        <Text text={footer} rtl={rtl} style={{ fontSize: 26, color: "#aab4d6" }} />
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist", data: latin, weight: 400, style: "normal" },
        { name: "IBM Plex Sans Arabic", data: arabic, weight: 700, style: "normal" },
      ],
    },
  );
}
