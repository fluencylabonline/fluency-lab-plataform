"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { convertToAvailableAction } from "@/modules/scheduling/scheduling.actions";
import { Spinner } from "@/components/ui/spinner";
import { useTranslations, useLocale } from "next-intl";

interface ConvertClassFormProps {
  classData: {
    id: string;
    startAt: Date;
    studentName: string;
  };
}

export function ConvertClassForm({ classData }: ConvertClassFormProps) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const t = useTranslations("ConvertClass");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const handleConvert = async () => {
    setIsPending(true);
    const promise = convertToAvailableAction({ classId: classData.id });

    notify.promise(promise, {
      loading: t("converting") || "Convertendo...",
      success: (result) => {
        if (result?.data?.success) {
          router.push("/hub");
          router.refresh();
          return t("success") || "Aula convertida com sucesso!";
        }
        throw new Error(result?.data?.error || t("error") || "Erro ao converter aula");
      },
      error: (err: unknown) => {
        setIsPending(false);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return errorMessage || t("error") || "Erro ao converter aula";
      },
    });
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="card p-6 flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{t("title") || "Converter Aula"}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t.rich("description", {
              studentName: classData.studentName,
              strong: (chunks) => <strong>{chunks}</strong>
            }) || `Você está convertendo o horário de ${classData.studentName}`}
          </p>
        </div>

        <div className="w-full bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-left">
          <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">
            {t("scheduleDetails") || "Detalhes"}
          </div>
          <div className="text-lg font-medium">
            {format(new Date(classData.startAt), "EEEE, d 'de' MMMM", { locale: dateLocale })}
          </div>
          <div className="text-slate-600 dark:text-slate-400">
            {locale === "pt" ? "às" : "at"} {format(new Date(classData.startAt), "HH:mm")}
          </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <Button 
            onClick={handleConvert} 
            disabled={isPending}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isPending ? (
              <Spinner className="mr-2" />
            ) : (
              <Check className="mr-2 w-5 h-5" />
            )}
            {t("confirmButton") || "Confirmar"}
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            disabled={isPending}
          >
            {t("cancelButton") || "Cancelar"}
          </Button>
        </div>

        <p className="text-xs text-gray-400 italic">
          {t("disclaimer") || "Essa ação não pode ser desfeita."}
        </p>
      </div>
    </div>
  );
}
