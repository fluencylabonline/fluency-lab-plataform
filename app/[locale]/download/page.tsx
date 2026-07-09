import { getTranslations } from "next-intl/server";
import { DownloadClient } from "./_components/DownloadClient";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Download");
  return {
    title: `${t("title") || "Instale o FluencyLab"} | FluencyLab`,
    description: t("subtitle") || "Adicione a plataforma à sua tela inicial para uma experiência rápida e fluida.",
  };
}

export default async function DownloadPage() {
  const t = await getTranslations("Download");

  return (
    <DownloadClient 
      translations={{
        title: t("title") || "Instale o FluencyLab",
        subtitle: t("subtitle") || "Tenha a melhor experiência de aprendizado adicionando nossa plataforma à sua tela inicial",
        installButton: t("installButton") || "Instalar Aplicativo",
        iosTitle: t("iosTitle") || "Instruções para iPhone e iPad (Safari)",
        iosStep1: t("iosStep1") || "Clique no botão de Compartilhar (ícone com seta para cima na barra inferior)",
        iosStep2: t("iosStep2") || "Role a lista para baixo e clique em 'Adicionar à Tela de Início'",
        iosStep3: t("iosStep3") || "Confirme clicando em 'Adicionar' no canto superior direito",
        androidTitle: t("androidTitle") || "Instruções para Android (Chrome)",
        androidStep1: t("androidStep1") || "Abra o menu do Chrome clicando nos três pontinhos no canto superior direito",
        androidStep2: t("androidStep2") || "Clique em 'Adicionar à tela inicial' ou 'Instalar aplicativo'",
        androidStep3: t("androidStep3") || "Confirme a instalação na janela de diálogo",
        alreadyInstalled: t("alreadyInstalled") || "O aplicativo já está instalado!",
        backToPlatform: t("backToPlatform") || "Ir para a plataforma",
      }} 
    />
  );
}
