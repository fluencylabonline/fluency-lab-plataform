"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveTrialGuestEmailAction } from "../trial-call.actions";

type Status = "idle" | "saving" | "saved" | "invalid" | "failed";

/** Fim da chamada: o visitante deixa o e-mail (opcional) para o professor entrar em contato. */
export function GuestEmailForm({ code, requestId, guestId }: { code: string; requestId: string; guestId: string }) {
  const t = useTranslations("TrialClass.Email");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) return setStatus("invalid");
    setStatus("saving");
    const res = await saveTrialGuestEmailAction({ code, requestId, guestId, email: value });
    setStatus(res?.data?.saved ? "saved" : "failed");
  };

  if (status === "saved") {
    return (
      <p className="flex items-center gap-2 text-base font-semibold" role="status">
        <Check className="size-5 text-emerald-400" aria-hidden />{t("thanks")}
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3 text-center">
      <p className="text-base font-semibold">{t("title")}</p>
      <p className="text-sm text-white/70">{t("subtitle")}</p>
      <label className="sr-only" htmlFor="trial-email">{t("label")}</label>
      <input
        id="trial-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        disabled={status === "saving"}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={t("placeholder")}
        className="h-12 rounded-full border border-white/25 bg-white/10 px-5 text-base text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-white"
      />
      {status === "invalid" && <p className="text-sm text-red-300" role="alert">{t("invalid")}</p>}
      {status === "failed" && <p className="text-sm text-red-300" role="alert">{t("failed")}</p>}
      <Button size="lg" className="h-12 rounded-full text-base font-bold" disabled={status === "saving"} onClick={submit}>
        {status === "saving" ? <Loader2 className="size-5 animate-spin" aria-hidden /> : t("send")}
      </Button>
    </div>
  );
}
