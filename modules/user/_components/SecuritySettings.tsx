"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Shield, Key, Lock, Smartphone } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { notify } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { TotpEnrollmentVault } from "./TotpEnrollmentVault";
import { 
  changePasswordSchema, 
  setPasswordSchema, 
  type ChangePasswordValues, 
  type SetPasswordValues 
} from "@/modules/user/user.schema";
import { 
  Vault, 
  VaultHeader, 
  VaultContent, 
  VaultTitle, 
  VaultDescription, 
  VaultIcon,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { Spinner } from "@/components/ui/spinner";
import { useEffect } from "react";

interface SecuritySettingsProps {
  hasPassword?: boolean;
}

export function SecuritySettings({ hasPassword: initialHasPassword }: SecuritySettingsProps) {
  const t = useTranslations("Settings");
  const ta = useTranslations("Auth");
  const tc = useTranslations("Common");
  
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isTotpVaultOpen, setIsTotpVaultOpen] = useState(false);
  const [isConfirmMfaVaultOpen, setIsConfirmMfaVaultOpen] = useState(false);
  const [isDisablingMfa, setIsDisablingMfa] = useState(false);

  const fetchMfaStatus = () => {
    authClient.getMfaStatus().then(status => setMfaEnabled(status));
  };

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  // Form for changing password
  const changeForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Form for setting password
  const setForm = useForm<SetPasswordValues>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onChangePassword = async (values: ChangePasswordValues) => {
    setIsChangingPassword(true);
    const result = await authClient.updatePassword(values.currentPassword, values.newPassword);
    setIsChangingPassword(false);

    if (result.success) {
      notify.success(t("passwordUpdated"));
      changeForm.reset();
    } else {
      notify.error(ta(`errors.${result.error}`) || tc("error"));
    }
  };

  const onSetPassword = async (values: SetPasswordValues) => {
    setIsSettingPassword(true);
    const result = await authClient.linkPassword(values.password);
    setIsSettingPassword(false);

    if (result.success) {
      notify.success(t("passwordSetSuccess"));
      setHasPassword(true);
      setForm.reset();
    } else {
      notify.error(ta(`errors.${result.error}`) || tc("error"));
    }
  };

  const onDisableMfa = async () => {
    setIsDisablingMfa(true);
    const result = await authClient.disableMfa();
    setIsDisablingMfa(false);

    if (result.success) {
      notify.success(t("mfaDisabled") || "MFA desativado com sucesso.");
      setMfaEnabled(false);
      setIsConfirmMfaVaultOpen(false);
    } else {
      notify.error(tc("error"));
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Password Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{t("password")}</h3>
            <p className="text-sm text-muted-foreground">
              {hasPassword ? t("passwordDesc") : t("setPasswordDesc")}
            </p>
          </div>
        </div>

        {hasPassword ? (
          <form onSubmit={changeForm.handleSubmit(onChangePassword)} className="space-y-4 pt-2">
            <Field label={ta("labels.currentPassword") || "Senha Atual"}>
              <Input 
                type="password" 
                {...changeForm.register("currentPassword")} 
                placeholder="••••••••"
              />
            </Field>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={ta("labels.newPassword") || "Nova Senha"}>
                <Input 
                  type="password" 
                  {...changeForm.register("newPassword")} 
                  placeholder="••••••••"
                />
              </Field>
              <Field label={ta("labels.confirmPassword") || "Confirmar Nova Senha"}>
                <Input 
                  type="password" 
                  {...changeForm.register("confirmPassword")} 
                  placeholder="••••••••"
                />
              </Field>
            </div>

            <Button type="submit" disabled={isChangingPassword} className="w-full md:w-fit">
              {isChangingPassword ? <Spinner className="mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {t("updatePassword")}
            </Button>
          </form>
        ) : (
          <form onSubmit={setForm.handleSubmit(onSetPassword)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={ta("labels.newPassword") || "Definir Senha"}>
                <Input 
                  type="password" 
                  {...setForm.register("password")} 
                  placeholder="••••••••"
                />
              </Field>
              <Field label={ta("labels.confirmPassword") || "Confirmar Senha"}>
                <Input 
                  type="password" 
                  {...setForm.register("confirmPassword")} 
                  placeholder="••••••••"
                />
              </Field>
            </div>

            <Button type="submit" disabled={isSettingPassword} className="w-full md:w-fit">
              {isSettingPassword ? <Spinner className="mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              {t("setPassword")}
            </Button>
          </form>
        )}
      </div>

      {/* 2FA Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{t("twoFactorTitle") || "Autenticação em Duas Etapas"}</h3>
              <p className="text-sm text-muted-foreground">
                {t("twoFactorDesc") || "Adicione uma camada extra de segurança à sua conta."}
              </p>
            </div>
          </div>
          <Switch 
            checked={mfaEnabled} 
            disabled={isDisablingMfa}
            onCheckedChange={async (val) => {
              if (val) {
                setIsTotpVaultOpen(true);
              } else {
                setIsConfirmMfaVaultOpen(true);
              }
            }}
          />
        </div>

        <div className="p-4 bg-secondary/10 rounded-2xl flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="text-sm text-muted-foreground">
            {t("twoFactorHelp") || "Ao ativar a verificação em duas etapas, você precisará de um código gerado pelo seu aplicativo de autenticação para entrar."}
          </div>
        </div>
      </div>

      <TotpEnrollmentVault 
        open={isTotpVaultOpen}
        onOpenChange={setIsTotpVaultOpen}
        onSuccess={() => {
          setMfaEnabled(true);
        }}
      />

      <Vault open={isConfirmMfaVaultOpen} onOpenChange={setIsConfirmMfaVaultOpen}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <VaultTitle>{t("confirmDisableMfaTitle") || "Desativar MFA?"}</VaultTitle>
            <VaultDescription>
              {t("confirmDisableMfa") || "Tem certeza que deseja desativar a autenticação em duas etapas?"}
            </VaultDescription>
          </VaultHeader>
          
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsConfirmMfaVaultOpen(false)}>
              {tc("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton 
              variant="destructive" 
              onClick={onDisableMfa} 
              disabled={isDisablingMfa}
            >
              {isDisablingMfa ? <Spinner className="mr-2" /> : null}
              {t("disable") || "Desativar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
