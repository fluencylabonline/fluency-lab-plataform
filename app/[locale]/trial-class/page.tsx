import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth-server";
import { StartCall } from "@/modules/trial-call/_components/StartCall";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Só o admin logado vê o botão de iniciar; quem chega sem link recebe uma orientação. */
export default async function TrialClassPage() {
  const user = await getCurrentUser();
  if (user?.role === "admin") return <StartCall />;

  const t = await getTranslations("TrialClass.Visitor");
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="max-w-sm space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
      </div>
    </main>
  );
}
