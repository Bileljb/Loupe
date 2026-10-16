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
          background: "linear-gradient(135deg, #0b1020 0%, #13204a 100%)",
          color: "#f5f7ff",
          fontFamily: "Geist, IBM Plex Sans Arabic",
        }}
      >
        <div style={{ display: "flex", flexDirection: rtl ? "row-reverse" : "row", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, border: "8px solid #7ea2ff", display: "flex" }} />
          <div style={{ fontSize: 40, fontWeight: 700 }}>{siteConfig.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: align, gap: 20, width: "100%" }}>
          <Text text={eyebrow} rtl={rtl} style={{ fontSize: 30, color: "#9fb7ff" }} />
          <Text text={title} rtl={rtl} style={{ fontSize: 64, lineHeight: 1.25, fontWeight: 700, maxWidth: 1050 }} />
        </div>
        <Text text={footer} rtl={rtl} style={{ fontSize: 26, color: "#c9d3f5" }} />
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
