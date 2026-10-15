import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const tSite = useTranslations("Site");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16 text-start">
      <p className="text-muted-foreground text-sm">{tSite("tagline")}</p>
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("intro")}</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground ps-4 border-s-2 ms-6">
          {t("scope")}
        </CardContent>
      </Card>
    </main>
  );
}
