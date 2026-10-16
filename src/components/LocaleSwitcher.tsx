"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { localeNames, routing } from "@/i18n/routing";

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
      <ul className="flex items-center gap-1">
        {routing.locales.map((locale) => (
          <li key={locale}>
            <Link
              href={pathname}
              locale={locale}
              lang={locale}
              hrefLang={locale}
              aria-current={locale === currentLocale ? "page" : undefined}
              className="rounded-md px-2 py-1 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring aria-[current=page]:font-semibold aria-[current=page]:underline"
            >
              {localeNames[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
