"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

/**
 * Erro inesperado em qualquer rota de [locale]: mostra mensagem traduzida dentro
 * do layout (com idioma e tema) em vez da tela genérica do Next.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Errors");

  useEffect(() => {
    console.error("[LocaleError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <main className="max-w-lg w-full text-center">
        <div className="card p-8 md:p-12 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-3 text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground leading-relaxed mb-8">{t("description")}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button onClick={() => reset()}>{t("retry")}</Button>
            <Link href="/hub">
              <Button variant="outline">{t("home")}</Button>
            </Link>
          </div>
          {error.digest && (
            <p className="mt-6 text-xs text-muted-foreground font-mono">{t("reference", { digest: error.digest })}</p>
          )}
        </div>
      </main>
    </div>
  );
}
