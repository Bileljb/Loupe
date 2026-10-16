import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  return { title: t("notFoundTitle") };
}

// Localized 404 for unknown paths under /en, /fr, /ar (see [...rest]). Next adds noindex.
export default async function NotFound() {
  const t = await getTranslations("NotFound");
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start gap-4 px-6 py-16 text-start">
      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("body")}</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/" className={buttonVariants()}>
          {t("home")}
        </Link>
        <Link href="/guides" className={buttonVariants({ variant: "outline" })}>
          {t("guides")}
        </Link>
      </div>
    </main>
  );
}
