"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, Globe, Mail, ShieldAlert, Camera } from "lucide-react";
import { AvatarUploadVault } from "./AvatarUploadVault";
import { CancelAccountVault } from "./CancelAccountVault";
import { updateLocaleAction } from "../user.actions";
import { notify } from "@/components/ui/toaster";
import { useRouter, usePathname } from "@/i18n/navigation";
import type { User } from "../user.schema";
import { PurgeAccountVault } from "./PurgeAccountVault";
import { ExportDataVault } from "./ExportDataVault";

const LOCALES = [
  { id: "pt", name: "Português (BR)", flag: "🇧🇷" },
  { id: "en", name: "English", flag: "🇺🇸" },
] as const;

interface AccountSettingsProps {
  initialData: {
    user: User;
    emailVerified: boolean;
  };
}

export function AccountSettings({ initialData }: AccountSettingsProps) {
  const t = useTranslations("Settings");
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isAvatarVaultOpen, setIsAvatarVaultOpen] = useState(false);
  const [isCancelVaultOpen, setIsCancelVaultOpen] = useState(false);
  const [isPurgeVaultOpen, setIsPurgeVaultOpen] = useState(false);
  const [isExportVaultOpen, setIsExportVaultOpen] = useState(false);
  const [isUpdatingLocale, setIsUpdatingLocale] = useState(false);

  const { user, emailVerified } = initialData;

  const handleLocaleChange = async (newLocale: "pt" | "en") => {
    if (locale === newLocale) return;
    
    const promise = (async () => {
      setIsUpdatingLocale(true);
      try {
        const result = await updateLocaleAction({ locale: newLocale });
        if (result?.data?.success) {
          router.replace(pathname, { locale: newLocale });
          return t("languageSuccess");
        }
        throw new Error(result?.data?.error || "Erro ao atualizar idioma");
      } finally {
        setIsUpdatingLocale(false);
      }
    })();

    notify.promise(promise, {
      loading: t("updatingLanguage") || "Atualizando idioma...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro inesperado",
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">{t("profile")}</h3>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-2 border-background ring-2 ring-muted group-hover:ring-primary/50 transition-all">
              <AvatarImage src={user.photoUrl || ""} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 rounded-full w-8 h-8 border shadow-sm"
              onClick={() => setIsAvatarVaultOpen(true)}
            >
              <Camera className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <p className="text-xl font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Language Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("language")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("languageDescription")}</p>
        
        <div className="grid grid-cols-2 gap-4">
          {LOCALES.map((lang) => (
            <button
              key={lang.id}
              disabled={isUpdatingLocale}
              onClick={() => handleLocaleChange(lang.id)}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                locale === lang.id
                  ? "border-primary bg-primary/5 font-bold"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              }`}
            >
              <span className="text-2xl leading-none">{lang.flag}</span>
              <span>{lang.id === "pt" ? "PT" : "EN"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email Verification Section */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("email")}</h3>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border">
          <span className="text-sm font-medium">{user.email}</span>
          {emailVerified ? (
            <Badge variant="success" className="gap-1 px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t("verified")}
            </Badge>
          ) : (
            <Badge variant="warning" className="gap-1 px-3 py-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {t("notVerified")}
            </Badge>
          )}
        </div>
      </div>

      {/* Data Management Section (LGPD) */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <ShieldAlert className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("exportData")}</h3>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground md:max-w-md">
            {t("exportDataDesc")}
          </p>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setIsExportVaultOpen(true)}
          >
            {t("exportData")}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-destructive/20 bg-destructive/5 space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">{t("cancellation")}</h3>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground md:max-w-md">
              {t("cancellationWarning")}
            </p>
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all" onClick={() => setIsCancelVaultOpen(true)}>
              {t("requestCancellation")}
            </Button>
          </div>
        </div>

        <div className="h-px bg-destructive/10" />

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">{t("purgeData")}</h3>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground md:max-w-md">
              {t("purgeDataWarning")}
            </p>
            <Button variant="destructive" className="transition-all" onClick={() => setIsPurgeVaultOpen(true)}>
              {t("purgeData")}
            </Button>
          </div>
        </div>
      </div>

      {/* Vaults */}
      <AvatarUploadVault
        userId={user.id}
        isOpen={isAvatarVaultOpen}
        onOpenChange={setIsAvatarVaultOpen}
      />
      <CancelAccountVault
        isOpen={isCancelVaultOpen}
        onOpenChange={setIsCancelVaultOpen}
      />
      <PurgeAccountVault
        isOpen={isPurgeVaultOpen}
        onOpenChange={setIsPurgeVaultOpen}
      />
      <ExportDataVault
        isOpen={isExportVaultOpen}
        onOpenChange={setIsExportVaultOpen}
        userId={user.id}
      />
    </div>
  );
}
