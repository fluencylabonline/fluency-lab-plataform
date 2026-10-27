import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { FaqClient } from "./_components/FaqClient";
import { settingsService } from "@/modules/settings/settings.service";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "FaqPage" });
  return {
    title: `${t("title")} | FluencyLab`,
    description: t("description"),
    alternates: { canonical: "/faq" },
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  const settings = await settingsService.getSettings();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="flex h-fit items-center justify-between">
          <BackButton href="/" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: settings.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />

      <main className="container flex-1 py-8 md:py-16">
        <FaqClient faq={settings.faq} />
      </main>
    </div>
  );
}