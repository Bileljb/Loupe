"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Short labels for narrow screens; the full name stays the accessible name. */
const shortNames: Record<AppLocale, string> = { en: "EN", fr: "FR", ar: "ع" };

export function LocaleSwitcher() {
  // Pathname without the locale prefix, so switching keeps the user on the same page.
  // On routes with request-time params (reports) this is runtime data: render inside <Suspense>.
  return <LocaleLinks pathname={usePathname()} />;
}

/** Same links pointing at each language's home page. Used as the Suspense fallback, so the header never shifts. */
export function LocaleLinks({ pathname = "/" }: { pathname?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const currentLocale = useLocale();

  return (
    <nav aria-label={t("label")}>
      <ul className="bg-muted/70 flex items-center gap-0.5 rounded-full border p-0.5">
        {routing.locales.map((locale) => {
          const current = locale === currentLocale;
          return (
            <li key={locale}>
              <Link
                href={pathname}
                locale={locale}
                lang={locale}
                hrefLang={locale}
                aria-label={localeNames[locale]}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 flex h-7 items-center rounded-full px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3",
                  current && "bg-background text-foreground shadow-sm",
                )}
              >
                <span className="sm:hidden" aria-hidden="true">
                  {shortNames[locale]}
                </span>
                <span className="hidden sm:inline" aria-hidden="true">
                  {localeNames[locale]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
