"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useTranslations } from "next-intl";
import { Smartphone, ArrowRight, CheckCircle2 } from "lucide-react";
import { 
  Vault, 
  VaultHeader, 
  VaultContent, 
  VaultBody, 
  VaultTitle, 
  VaultDescription, 
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { notify } from "@/components/ui/toaster";
import { Spinner } from "@/components/ui/spinner";

interface TotpEnrollmentVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TotpEnrollmentVault({ open, onOpenChange, onSuccess }: TotpEnrollmentVaultProps) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Auth");
  const tc = useTranslations("Common");

  const [step, setStep] = useState<"intro" | "qr" | "verify" | "success">("intro");
  const [totpSecret, setTotpSecret] = useState<{ secret: string; otpAuthUrl: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const startEnrollment = async () => {
    setLoading(true);
    const result = await authClient.getTotpSecret();
    setLoading(false);

    if (result.success && result.data) {
      setTotpSecret(result.data);
      setStep("qr");
    } else {
      notify.error(tc("error"));
    }
  };

  const verifyAndEnroll = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    const result = await authClient.enrollTotp(totpSecret!.secret, code);
    setLoading(false);

    if (result.success) {
      setStep("success");
      onSuccess();
    } else {
      notify.error(ta(`errors.${result.error}`) || tc("error"));
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="settings" />
          <VaultTitle>{t("twoFactorTitle")}</VaultTitle>
          <VaultDescription>{t("twoFactorDesc")}</VaultDescription>
        </VaultHeader>
        
        <VaultBody>
          {step === "intro" && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
                <Smartphone className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-xl">{t("mfaIntroTitle") || "Proteja sua conta"}</h4>
              <p className="text-muted-foreground">
                {t("mfaIntroDesc") || "Use um aplicativo de autenticação (como Google Authenticator ou Authy) para gerar códigos de segurança."}
              </p>
              <VaultPrimaryButton onClick={startEnrollment} disabled={loading} className="w-full">
                {loading ? <Spinner className="mr-2" /> : t("mfaGetStarted") || "Começar Configuração"}
              </VaultPrimaryButton>
            </div>
          )}

          {step === "qr" && totpSecret && (
            <div className="space-y-6 text-center py-2">
              <div className="p-2 bg-white rounded-3xl inline-block mx-auto border-8 border-secondary/20 shadow-xl">
                <QRCodeSVG 
                  value={totpSecret.otpAuthUrl} 
                  size={200}
                  level="M"
                  marginSize={0}
                />
              </div>
              <div className="space-y-2 text-sm text-muted-foreground px-4">
                <p className="font-medium text-foreground">
                  {t("mfaScanTitle") || "1. Escaneie o QR Code"}
                </p>
                <p>
                  {t("mfaScanDesc") || "Abra seu app de autenticação e escaneie a imagem acima."}
                </p>
              </div>
              <VaultPrimaryButton onClick={() => setStep("verify")} className="w-full">
                {tc("continue")} <ArrowRight className="w-4 h-4 ml-2" />
              </VaultPrimaryButton>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-6 text-center py-4">
              <div className="space-y-2">
                <h4 className="font-bold text-lg">{t("mfaVerifyTitle") || "2. Insira o código"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("mfaVerifyDesc") || "Digite o código de 6 dígitos gerado pelo seu aplicativo."}
                </p>
              </div>

              <div className="max-w-[240px] mx-auto">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-3xl tracking-[0.5em] font-mono h-16 rounded-2xl"
                  autoFocus
                />
              </div>

              <VaultPrimaryButton 
                onClick={verifyAndEnroll} 
                disabled={loading || code.length !== 6} 
                className="w-full"
              >
                {loading ? <Spinner className="mr-2" /> : t("mfaVerifyButton") || "Verificar e Ativar"}
              </VaultPrimaryButton>
              <VaultSecondaryButton onClick={() => setStep("qr")} className="w-full">
                {tc("back")}
              </VaultSecondaryButton>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-xl">{t("mfaSuccessTitle") || "MFA Ativado!"}</h4>
              <p className="text-muted-foreground">
                {t("mfaSuccessDesc") || "Sua conta agora está protegida com autenticação em duas etapas."}
              </p>
            </div>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
