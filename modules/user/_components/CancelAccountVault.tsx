"use client";

import { useState } from "react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
  VaultIcon,
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { requestSelfCancellationAction } from "../user.actions";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

interface CancelAccountVaultProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelAccountVault({ isOpen, onOpenChange }: CancelAccountVaultProps) {
  const t = useTranslations("Settings");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    const promise = (async () => {
      setIsLoading(true);
      try {
        const result = await requestSelfCancellationAction();
        
        if (result?.data?.success) {
          if (result.data.feeRequired) {
            router.refresh();
          } else {
            router.push("/suspended");
          }
          onOpenChange(false);
          return t("cancellationRequestSuccess") || "Solicitação enviada!";
        }
        
        throw new Error(result?.data?.error || "Erro ao solicitar cancelamento");
      } finally {
        setIsLoading(false);
      }
    })();

    notify.promise(promise, {
      loading: t("requestingCancellation") || "Processando solicitação...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro inesperado",
    });
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="warning" />
          <VaultTitle>{t("cancellation")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="font-semibold text-sm">{t("cancellationWarning")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium">{t("cancellationConsequences")}</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4 text-destructive" />
                  {t("consequenceClasses")}
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4 text-destructive" />
                  {t("consequenceAccess")}
                </li>
                <li className="flex items-center gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  {t("consequenceFee")}
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              <Button variant="destructive" fullWidth onClick={handleCancel} isLoading={isLoading}>
                {t("cancelConfirm")}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)} disabled={isLoading}>
                {t("keepAccount")}
              </Button>
            </div>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
