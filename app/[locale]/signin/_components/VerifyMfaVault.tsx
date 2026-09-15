"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Shield, ArrowRight } from "lucide-react";
import { 
  Vault, 
  VaultHeader, 
  VaultContent, 
  VaultBody, 
  VaultTitle, 
  VaultDescription, 
  VaultIcon,
  VaultPrimaryButton
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";
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
  // evita disparar a verificação duas vezes para o mesmo código
  const verifiedCodeRef = useRef<string | null>(null);

  const handleVerify = useCallback(async (value: string) => {
    if (value.length !== 6) return;

    verifiedCodeRef.current = value;
    setLoading(true);
    const result = await verifyMfaLoginAction({ token: value, rememberMe });
    setLoading(false);

    if (result?.data?.success) {
      onSuccess(result.data.role);
    } else {
      notify.error(ta(`errors.${result?.data?.error || "error"}`) || tc("error"));
      setCode("");
      verifiedCodeRef.current = null;
    }
  }, [rememberMe, onSuccess, ta, tc]);

  // verifica automaticamente assim que os 6 dígitos são preenchidos
  useEffect(() => {
    if (code.length === 6 && !loading && verifiedCodeRef.current !== code) {
      handleVerify(code);
    }
  }, [code, loading, handleVerify]);

  // limpa o estado ao fechar/reabrir o vault
  useEffect(() => {
    if (!open) {
      setCode("");
      verifiedCodeRef.current = null;
    }
  }, [open]);

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

            <div className="max-w-[240px] mx-auto py-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.5em] font-mono h-16 rounded-md"
                autoFocus
                disabled={loading}
                type="number"
              />
            </div>

            <VaultPrimaryButton 
              onClick={() => handleVerify(code)} 
              disabled={loading || code.length !== 6} 
              className="w-full"
            >
              {loading ? <Spinner className="mr-2" /> : tc("continue")}
              {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
            </VaultPrimaryButton>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
