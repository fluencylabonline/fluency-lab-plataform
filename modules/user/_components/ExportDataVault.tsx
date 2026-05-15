"use client";

import { useState } from "react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
  VaultIcon,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { useTranslations } from "next-intl";
import { Download, ShieldCheck } from "lucide-react";
import { exportMyDataAction } from "../user.actions";
import { notify } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

interface ExportDataVaultProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function ExportDataVault({ isOpen, onOpenChange, userId }: ExportDataVaultProps) {
  const t = useTranslations("Settings");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const handleExport = async () => {
    if (!password) {
      notify.error(t("passwordRequired") || "Senha obrigatória");
      return;
    }

    setIsLoading(true);
    try {
      const result = await exportMyDataAction({ password });
      
      if (result?.data?.success) {
        const blob = new Blob([JSON.stringify(result.data.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `fluencylab-data-${userId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        notify.success(t("exportSuccess") || "Dados exportados com sucesso!");
        onOpenChange(false);
        setPassword("");
      } else {
        notify.error(t(result?.data?.error || "exportError") || "Erro ao exportar dados");
      }
    } catch {
      notify.error(t("exportError") || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="info">
            <Download className="w-6 h-6 text-primary" />
          </VaultIcon>
          <VaultTitle>{t("exportData")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 text-primary border border-primary/20">
              <ShieldCheck className="w-6 h-6 shrink-0 mt-1" />
              <div className="space-y-1">
                <p className="text-sm leading-relaxed">
                  {t("exportDataDesc")}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground italic">
                {t("exportSudoWarning") || "Por segurança, confirme sua identidade para exportar seus dados pessoais."}
              </p>
              
              <Field label={t("password") || "Senha"}>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>
            </div>
          </div>
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("cancel")}
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={handleExport}>
            {t("downloadJson") || "Baixar JSON"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
