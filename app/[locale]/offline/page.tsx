import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { WifiOff } from "lucide-react";

export default async function OfflinePage() {
  const t = await getTranslations("Offline");

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{t("title") || "Você está offline"}</h1>
        <p className="text-muted-foreground">
          {t("description") || "Parece que você não tem conexão com a internet. Verifique sua rede e tente novamente."}
        </p>
      </div>
      <Link href="/">
        <Button>{t("retry") || "Tentar novamente"}</Button>
      </Link>
    </div>
  );
}
