import { contractService } from "@/modules/contract/contract.service";
import { format } from "date-fns";
import { CheckCircle2, XCircle, ShieldCheck, Calendar, Clock, User, Globe, FileCode } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

interface VerifyContractPageProps {
  params: Promise<{
    hash: string;
    locale: string;
  }>;
}

export default async function VerifyContractPage({ params }: VerifyContractPageProps) {
  const { hash, locale } = await params;
  const result = await contractService.verifyContract(hash);
  const t = await getTranslations({ locale, namespace: "Contracts" });

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
      <main className="container max-w-2xl py-12 px-4">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
            <ShieldCheck className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold">{t("verify.title")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("verify.subtitle")}
          </p>
        </div>

        {result.isValid && result.contractName ? (
          <div className={cn(
            "card p-8 relative overflow-hidden",
            result.status === "signed" && "border-emerald-500/30 bg-emerald-500/5",
            result.status === "cancelled" && "border-rose-500/30 bg-rose-500/5",
            result.status === "expired" && "border-zinc-500/30 bg-zinc-500/5",
            result.status === "pending" && "border-amber-500/30 bg-amber-500/5"
          )}>
            <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-black rounded-full shadow-sm">
              {result.status === "cancelled" ? (
                <div className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-100 dark:bg-rose-950/50 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" />
                  {(t("status.cancelled") || "Cancelado").toUpperCase()}
                </div>
              ) : result.status === "expired" ? (
                <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-950/50 px-3 py-1 rounded-full">
                  <XCircle className="w-4 h-4" />
                  {(t("status.expired") || "Expirado").toUpperCase()}
                </div>
              ) : result.status === "pending" ? (
                <div className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5 bg-amber-100 dark:bg-amber-950/50 px-3 py-1 rounded-full">
                  <Clock className="w-4 h-4" />
                  {(t("status.pending") || "Pendente").toUpperCase()}
                </div>
              ) : (
                <div className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  {(t("verify.validBadge") || "Assinatura Válida").toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <div className="border-b border-gray-200/50 dark:border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">{t("verify.signedBy")}</span>
                </div>
                <p className="text-xl font-bold">{result.signedBy || "N/A"}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileCode className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("verify.document")}</span>
                  </div>
                  <p className="font-semibold text-base">{result.contractName}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("verify.region")}</span>
                  </div>
                  <p className="font-semibold text-base uppercase">{result.region || "BR"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("verify.signedAt")}</span>
                  </div>
                  <p className="font-semibold text-base">
                    {result.signedAt ? format(new Date(result.signedAt), "dd/MM/yyyy HH:mm") : "N/A"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t("instances.status") || "Status"}</span>
                  </div>
                  <div className="pt-0.5">
                    {result.status === "signed" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                        {t("status.signed") || "Assinado"}
                      </span>
                    )}
                    {result.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded">
                        {t("status.cancelled") || "Cancelado"}
                      </span>
                    )}
                    {result.status === "expired" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 px-2.5 py-1 rounded">
                        {t("status.expired") || "Expirado"}
                      </span>
                    )}
                    {result.status === "pending" && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded">
                        {t("status.pending") || "Pendente"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result.audit && result.audit.length > 0 && (
                <div className="bg-white/50 dark:bg-zinc-950/20 p-4 rounded-lg border border-gray-200/50 dark:border-gray-800">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">{t("verify.auditTitle")}</span>
                  <div className="space-y-2">
                    {result.audit.map((auditItem, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1 border-t border-gray-100 dark:border-zinc-800/50 pt-2 first:border-0 first:pt-0">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(auditItem.timestamp), "dd/MM/yyyy HH:mm:ss")} (UTC)
                        </span>
                        <span>{t("verify.ipLabel")}: <strong className="font-mono text-foreground">{auditItem.ip}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200/50 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-muted-foreground gap-2">
                <p className="break-all">{t("verify.hashLabel")}: <span className="font-mono font-bold text-foreground">{hash}</span></p>
                <p className="shrink-0 font-medium">Fluency Lab Plataform</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-destructive/30 bg-destructive/5 p-12 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-destructive">{t("verify.invalidTitle")}</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {t("verify.invalidDesc", { hash })}
            </p>
            <p className="text-muted-foreground mt-2 text-xs leading-normal">
              {t("verify.invalidDetail")}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
