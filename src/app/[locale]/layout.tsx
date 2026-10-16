import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { DirectionProvider } from "@/components/ui/direction";
import { Suspense } from "react";
import { LocaleLinks, LocaleSwitcher } from "@/components/LocaleSwitcher";
import { getDirection, routing } from "@/i18n/routing";
import { siteConfig } from "@/lib/siteConfig";
import "../globals.css";

const latinSans = Geist({
  variable: "--font-latin",
  subsets: ["latin"],
});

// Not preloaded: its unicode-range means only pages with Arabic text download it.
const arabicSans = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  preload: false,
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return {
    metadataBase: new URL(siteConfig.url),
    title: t("title", { name: siteConfig.name }),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const dir = getDirection(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${latinSans.variable} ${arabicSans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <header className="flex items-center justify-between gap-4 px-6 py-4">
              <span className="font-semibold">{siteConfig.name}</span>
              <Suspense fallback={<LocaleLinks />}>
                <LocaleSwitcher />
              </Suspense>
            </header>
            {children}
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
