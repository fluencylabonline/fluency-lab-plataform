"use client";

import { useState } from "react";
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
  onSuccess: () => void;
}

export function VerifyMfaVault({ open, onOpenChange, onSuccess }: VerifyMfaVaultProps) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Auth");
  const tc = useTranslations("Common");

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    const result = await verifyMfaLoginAction({ token: code });
    setLoading(false);

    if (result?.data?.success) {
      onSuccess();
    } else {
      notify.error(ta(`errors.${result?.data?.error || "error"}`) || tc("error"));
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="settings" />
          <VaultTitle>{t("twoFactorTitle")}</VaultTitle>
          <VaultDescription>{t("mfaVerifyDesc")}</VaultDescription>
        </VaultHeader>
        
        <VaultBody>
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="font-bold text-lg">{t("mfaVerifyTitle") || "Insira o código"}</h4>
              <p className="text-sm text-muted-foreground">
                {t("mfaLoginDesc") || "Digite o código de 6 dígitos do seu aplicativo de autenticação."}
              </p>
            </div>

            <div className="max-w-[240px] mx-auto">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.5em] font-mono h-16 rounded-2xl"
                autoFocus
                disabled={loading}
              />
            </div>

            <VaultPrimaryButton 
              onClick={handleVerify} 
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
