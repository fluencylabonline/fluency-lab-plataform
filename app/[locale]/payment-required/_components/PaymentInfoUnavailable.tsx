"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mostrado quando não foi possível carregar/gerar a cobrança (ex.: provedor fora do ar). */
export function PaymentInfoUnavailable() {
  const t = useTranslations("PaymentRequired");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="card max-w-md w-full p-8 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("unavailable")}</p>
        <Button onClick={() => startTransition(() => router.refresh())} disabled={isPending}>
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("tryAgain")}
        </Button>
        <p className="text-xs text-muted-foreground">{t("helpInfo")}</p>
      </div>
    </div>
  );
}
