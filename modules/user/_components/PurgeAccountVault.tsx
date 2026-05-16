"use client";

import { useState } from "react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
  VaultIcon,
  VaultField,
  VaultInput,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { useTranslations } from "next-intl";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { requestPermanentDeletionAction } from "../user.actions";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PurgeAccountVaultProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurgeAccountVault({ isOpen, onOpenChange }: PurgeAccountVaultProps) {
  const t = useTranslations("Settings");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const router = useRouter();

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setPassword("");
    }
  }, [isOpen]);

  const handlePurge = async () => {
    if (!password) {
      notify.error(t("passwordRequired"));
      return;
    }

    const promise = (async () => {
      setIsLoading(true);
      try {
        const result = await requestPermanentDeletionAction({ password });
        
        if (result?.data?.success) {
          onOpenChange(false);
          router.push("/signin");
          return t("purgeRequestSuccess");
        }
        
        throw new Error(result?.data?.error || "Erro ao excluir conta");
      } finally {
        setIsLoading(false);
      }
    })();

    notify.promise(promise, {
      loading: t("requestingPurge"),
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro inesperado",
    });
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="error" />
          <VaultTitle>{t("purgeData")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-4 p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="font-semibold text-sm leading-tight">
                  {t("purgeDataWarning")}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {t("purgeExplanation")}
            </p>

            <VaultField 
              label={t("confirmIdentity")} 
              required
            >
              <div className="relative">
                <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                <VaultInput
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </VaultField>
          </div>
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton 
            onClick={() => onOpenChange(false)} 
            disabled={isLoading}
          >
            {t("keepAccount")}
          </VaultSecondaryButton>
          <VaultPrimaryButton 
            variant="destructive" 
            onClick={handlePurge}
            disabled={!password || isLoading}
          >
            {t("purgeConfirm")}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
