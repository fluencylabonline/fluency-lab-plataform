import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: t("terms.title"),
  };
}

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("Legal");

  // Dynamically load the correct JSON based on locale
  const termsOfUse = await import(`@/modules/contract/terms-of-use.${locale}.json`)
    .then((m) => m.default)
    .catch(() => import(`@/modules/contract/terms-of-use.pt.json`).then((m) => m.default));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 w-full border-b bg-background">
        <div className="flex h-fit items-center justify-between">
          <BackButton href="/" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="container flex-1 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="card p-6 md:p-12 border-none bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent">
            <header className="mb-12 text-center md:text-left">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
                {t("terms.title")}
              </h1>
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                <p>{t("version")}: {termsOfUse.version}</p>
                <span className="hidden md:inline text-muted-foreground/30">•</span>
                <p>{t("effectiveDate")}: {termsOfUse.effectiveDate}</p>
              </div>
            </header>

            <div className="space-y-12 md:space-y-20">
              {termsOfUse.sections.map((section: { title: string; content: string }, index: number) => (
                <section key={index} className="group transition-all">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-baseline gap-4">
                    <span className="text-primary/20 text-4xl md:text-5xl font-serif">{(index + 1).toString().padStart(2, '0')}</span>
                    {section.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-lg md:text-xl max-w-none">
                    {section.content}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
