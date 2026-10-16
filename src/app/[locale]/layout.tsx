import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { DirectionProvider } from "@/components/ui/direction";
import { Suspense } from "react";
import { LocaleLinks, LocaleSwitcher } from "@/components/LocaleSwitcher";
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
    <html
      lang={locale}
      dir={dir}
      className={`${latinSans.variable} ${arabicSans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <NextIntlClientProvider>
          <DirectionProvider direction={dir}>
            <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-4">
                <Link href="/" className="rounded-md font-semibold focus-visible:outline-2 focus-visible:outline-ring">
                  {siteConfig.name}
                </Link>
                <Link href="/guides" className="text-muted-foreground hover:text-foreground rounded-md text-sm focus-visible:outline-2 focus-visible:outline-ring">
                  {tNav("guides")}
                </Link>
              </div>
              <Suspense fallback={<LocaleLinks />}>
                <LocaleSwitcher />
              </Suspense>
            </header>
            {children}
            <footer className="text-muted-foreground mt-auto border-t px-4 py-6 text-sm sm:px-6">
              <nav aria-label={tNav("footerLabel")} className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2">
                <Link href="/" className="hover:text-foreground">
                  {tNav("home")}
                </Link>
                <Link href="/guides" className="hover:text-foreground">
                  {tNav("guides")}
                </Link>
                <span className="ms-auto">{tNav("footerNote")}</span>
              </nav>
            </footer>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
