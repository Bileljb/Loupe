import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { LocaleLinks, LocaleSwitcher } from "@/components/LocaleSwitcher";
import { LogoMark } from "@/components/Logo";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { DirectionProvider } from "@/components/ui/direction";
import { Link } from "@/i18n/navigation";
import { getDirection, routing } from "@/i18n/routing";
import { ogLocales } from "@/lib/seo";
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

// Defaults for every page. Indexable pages override title, description, canonical and social
// cards in full via pageMetadata(); reports keep these defaults plus noindex.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("Metadata");
  const title = t("title", { name: siteConfig.name });
  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: title, template: `%s | ${siteConfig.name}` },
    description: t("description"),
    applicationName: siteConfig.name,
    openGraph: { type: "website", siteName: siteConfig.name, title, description: t("description"), locale: ogLocales[locale] },
    twitter: { card: "summary_large_image", title, description: t("description") },
  };
}

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  const dir = getDirection(locale);
  const tNav = await getTranslations("Nav");

  return (
    // The theme script may add .light/.dark to <html> before React hydrates.
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${latinSans.variable} ${arabicSans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <a
              href="#main"
              className="bg-primary text-primary-foreground sr-only z-50 rounded-lg px-4 py-2 font-medium focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
            >
              {tNav("skip")}
            </a>
            <header className="surface-glass sticky top-0 z-40 border-b">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <div className="flex items-center gap-6">
                  <Link
                    href="/"
                    className="focus-visible:ring-ring/50 flex items-center gap-2 rounded-lg text-lg font-semibold tracking-tight outline-none focus-visible:ring-3"
                  >
                    <LogoMark />
                    {siteConfig.name}
                  </Link>
                  <nav aria-label={tNav("mainLabel")} className="hidden sm:block">
                    <Link
                      href="/guides"
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md px-2 py-1 text-sm font-medium outline-none transition-colors focus-visible:ring-3"
                    >
                      {tNav("guides")}
                    </Link>
                  </nav>
                </div>
                <div className="flex items-center gap-2">
                  <Suspense fallback={<LocaleLinks />}>
                    <LocaleSwitcher />
                  </Suspense>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            <div id="main" className="flex flex-1 flex-col">
              {children}
            </div>
            <footer className="mt-auto border-t">
              <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div className="flex items-center gap-2">
                  <LogoMark className="size-5" />
                  <span className="text-foreground font-medium">{siteConfig.name}</span>
                  <span aria-hidden="true">·</span>
                  <span>{tNav("footerNote")}</span>
                </div>
                <nav aria-label={tNav("footerLabel")} className="flex gap-5">
                  <Link href="/" className="hover:text-foreground transition-colors">
                    {tNav("home")}
                  </Link>
                  <Link href="/guides" className="hover:text-foreground transition-colors">
                    {tNav("guides")}
                  </Link>
                </nav>
              </div>
            </footer>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
