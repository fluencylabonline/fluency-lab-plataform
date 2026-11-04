import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Título da aba por página do hub (Metadata.pages.<chave>), completado pelo
 * template "%s | FluencyLab" do layout. Uso: export const generateMetadata = pageTitle("teacherSchedule");
 */
export function pageTitle(key: string) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: "Metadata.pages" });
    return { title: t(key as Parameters<typeof t>[0]) };
  };
}
