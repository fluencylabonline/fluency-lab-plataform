"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTrialRoomAction } from "../trial-call.actions";

/** Admin: um botão, uma chamada instantânea. Cria a sala e vai direto para ela. */
export function StartCall() {
  const t = useTranslations("TrialClass.Start");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const start = async () => {
    setBusy(true);
    setFailed(false);
    const res = await createTrialRoomAction();
    if (res?.data?.code) return router.push(`/trial-class/${res.data.code}`);
    setFailed(true);
    setBusy(false);
  };

  return (
    <main className="grid min-h-dvh place-items-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary"><Video className="size-7" aria-hidden /></span>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button size="lg" className="h-12 w-full rounded-full text-base font-bold" disabled={busy} onClick={start}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Video className="size-5" aria-hidden />}
          {busy ? t("starting") : t("button")}
        </Button>
        {failed && <p className="text-sm font-medium text-destructive" role="alert">{t("error")}</p>}
      </div>
    </main>
  );
}
