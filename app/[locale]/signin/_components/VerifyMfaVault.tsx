"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";
import { 
  Vault, 
  VaultHeader, 
  VaultContent, 
  VaultBody, 
  VaultTitle, 
  VaultDescription, 
  VaultIcon,
} from "@/components/ui/vault";
import { OtpInput, type OtpStatus } from "@/components/ui/otp-input";
import { notify } from "@/components/ui/toaster";
import { verifyMfaLoginAction } from "@/modules/user/user.actions";

interface VerifyMfaVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (role?: string) => void;
  rememberMe?: boolean;
}

export function VerifyMfaVault({ open, onOpenChange, onSuccess, rememberMe = false }: VerifyMfaVaultProps) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Auth");
  const tc = useTranslations("Common");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<OtpStatus>("idle");

  const handleVerify = useCallback(async (value: string) => {
    setLoading(true);
    const result = await verifyMfaLoginAction({ token: value, rememberMe });
    setLoading(false);

    if (result?.data?.success) {
      setStatus("success");
      // deixa o usuário ver os campos verdes antes de seguir
      setTimeout(() => onSuccess(result.data?.role), 700);
    } else {
      setStatus("error");
      notify.error(ta(`errors.${result?.data?.error || "error"}`) || tc("error"));
    }
  }, [rememberMe, onSuccess, ta, tc]);

  const handleChange = useCallback((value: string) => {
    setCode(value);
    setStatus("idle");
  }, []);

  // limpa o estado ao fechar o vault (ajuste durante o render, sem effect)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setCode("");
      setStatus("idle");
    }
  }

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="settings" />
          <VaultTitle>{t("twoFactorTitle")}</VaultTitle>
          <VaultDescription>{t("mfaVerifyDesc")}</VaultDescription>
        </VaultHeader>
        
        <VaultBody>
          <div className="space-y-2 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-lg">{t("mfaVerifyTitle") || "Insira o código"}</h4>
              <p className="hidden text-sm text-muted-foreground">
                {t("mfaLoginDesc") || "Digite o código de 6 dígitos do seu aplicativo de autenticação."}
              </p>
            </div>

            <div className="py-4">
              <OtpInput
                value={code}
                onChange={handleChange}
                onComplete={handleVerify}
                status={status}
                disabled={loading}
              />
            </div>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
