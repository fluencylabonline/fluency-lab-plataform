"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Mail,
  Phone,
  Calendar,
  Edit2,
  Eye,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DataRow } from "./UserDetailsPrimitives";
import {
  Vault,
  VaultContent,
  VaultFooter,
  VaultHeader,
  VaultInput,
  VaultPrimaryButton,
  VaultTitle,
  VaultTrigger,
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { User } from "../../user.schema";
import { Badge } from "@/components/ui/badge";
import {
  revealSensitiveDataAction,
  updateUserAction,
} from "../../user.actions";
import { Checkbox } from "@/components/ui/checkbox";
import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import type { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";

interface PersonalInfoTabProps {
  user: User;
  isAdmin: boolean;
  isUpdating: boolean;
  rateForm: UseFormReturn<FieldValues>;
  onUpdateRate: (data: { rate: number }) => Promise<void>;
}

export function PersonalInfoTab({
  user,
  isAdmin,
  isUpdating,
  rateForm,
  onUpdateRate,
}: PersonalInfoTabProps) {
  const t = useTranslations("UserManagement");
  const tRoles = useTranslations("UserRoles");

  const [revealingField, setRevealingField] = React.useState<
    "cellphone" | "taxId" | "businessTaxId" | "pixKey" | "guardianTaxId" | "guardianCellphone" | null
  >(null);
  const [adminPassword, setAdminPassword] = React.useState("");
  const [isRevealing, setIsRevealing] = React.useState(false);
  const [revealedValues, setRevealedValues] = React.useState<
    Record<string, string>
  >({});
  const [isVaultOpen, setIsVaultOpen] = React.useState(false);
  const [availableLanguages, setAvailableLanguages] = React.useState<
    LanguageWithLessons[]
  >([]);
  const [isTogglingLanguage, setIsTogglingLanguage] = React.useState(false);

  React.useEffect(() => {
    const fetchLanguages = async () => {
      const result = await getLanguagesAction({});
      if (result?.data) {
        setAvailableLanguages(result.data);
      }
    };
    fetchLanguages();
  }, []);

  const handleLanguageToggle = async (langId: string) => {
    if (isTogglingLanguage) return;

    setIsTogglingLanguage(true);
    try {
      const currentLanguages = user.languages || [];
      const newLanguages = currentLanguages.includes(langId)
        ? currentLanguages.filter((id) => id !== langId)
        : [...currentLanguages, langId];

      const result = await updateUserAction({
        id: user.id,
        languages: newLanguages,
      });

      if (result?.data?.success) {
        notify.success(t("success"));
      } else {
        notify.error(t("error"));
      }
    } catch {
      notify.error(t("error"));
    } finally {
      setIsTogglingLanguage(false);
    }
  };

  const handleReveal = async () => {
    if (!revealingField || !adminPassword) return;

    setIsRevealing(true);
    try {
      const result = await revealSensitiveDataAction({
        userId: user.id,
        field: revealingField,
        password: adminPassword,
      });

      if (result?.data?.success) {
        setRevealedValues((prev) => ({
          ...prev,
          [revealingField]: result.data!.data as string,
        }));
        setIsVaultOpen(false);
        setAdminPassword("");
        notify.success(t("success"));
      } else {
        notify.error(
          result?.data?.error === "authError" ? t("authError") : t("error"),
        );
      }
    } catch {
      notify.error(t("error"));
    } finally {
      setIsRevealing(false);
    }
  };

  const openRevealVault = (
    field: "cellphone" | "taxId" | "businessTaxId" | "pixKey" | "guardianTaxId" | "guardianCellphone",
  ) => {
    if (revealedValues[field]) return; // Already revealed
    setRevealingField(field);
    setIsVaultOpen(true);
  };

  return (
    <div className="card grid grid-cols-1 lg:grid-cols-[280px_1fr] overflow-hidden">
      {/* Left — identity column */}
      <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border/50">
        {/* Avatar block */}
        <div className="flex items-center gap-4 p-6 border-b border-border/50 bg-muted/5">
          <Avatar className="h-14 w-14 rounded-md border-2 border-background ring-1 ring-border shrink-0 shadow-sm">
            <AvatarImage src={user.photoUrl || ""} alt={user.name} />
            <AvatarFallback name={user.name} className="rounded-md text-sm font-black bg-primary/5 text-primary">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-black text-sm tracking-tight truncate">
              {user.name}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {tRoles(user.role as "admin" | "teacher" | "student" | "manager")}
            </p>
            <Badge
              variant={user.isActive ? "default" : "secondary"}
              className="mt-2 text-[9px] h-4 font-black"
            >
              {user.isActive ? t("active") : t("inactive")}
            </Badge>
          </div>
        </div>

        {/* Contact rows */}
        <div className="flex flex-col divide-y divide-border/50">
          <div className="flex items-center gap-3 px-6 py-4 group">
            <div className="p-1.5 rounded-sm bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
              <Mail className="w-3.5 h-3.5 shrink-0" />
            </div>
            <span className="text-xs font-medium truncate">{user.email}</span>
          </div>
          {user.cellphone && (
            <div
              className={`flex items-center gap-3 px-6 py-4 group transition-colors ${isAdmin && !revealedValues.cellphone ? "cursor-pointer hover:bg-primary/5" : ""}`}
              onClick={() => isAdmin && openRevealVault("cellphone")}
            >
              <div className="p-1.5 rounded-sm bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                <Phone className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-foreground/80">
                  {revealedValues.cellphone
                    ? revealedValues.cellphone
                    : `(••) •••••-${user.cellphone?.slice(-4)}`}
                </span>
                {isAdmin && !revealedValues.cellphone && (
                  <span className="text-[9px] text-primary font-bold uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("view")}
                  </span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 px-6 py-4 group">
            <div className="p-1.5 rounded-sm bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">
              {t("since")} {format(new Date(user.createdAt), "dd/MM/yyyy")}
            </span>
          </div>

          {user.role === "student" && user.classesStartDate && (
            <div className="flex items-center gap-3 px-6 py-4 group">
              <div className="p-1.5 rounded-sm bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider leading-none">
                  {t("classesStartDate")}
                </span>
                <span className="text-xs font-bold text-foreground/80 mt-1 leading-none">
                  {format(new Date(user.classesStartDate), "dd/MM/yyyy")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right — detail fields */}
      <div className="flex flex-col">
        <div className="px-6 py-4 border-b border-border/50 bg-muted/10">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/80">
            {t("additionalDetails")}
          </p>
        </div>
        <div className="px-6 py-2">
          <DataRow label={t("uniqueId")} mono>
            <span className="text-[10px] break-all opacity-70">{user.id}</span>
          </DataRow>
          <DataRow label={t("preferredLanguage")}>
            {user.locale === "pt" ? "Português (Brasil)" : "English (US)"}
          </DataRow>
          {user.birthDate && (
            <DataRow label={t("birthDate")}>
              <span>{format(new Date(user.birthDate), "dd/MM/yyyy")}</span>
            </DataRow>
          )}
          {user.guardianName && (
            <>
              <DataRow label={t("guardianName")}>
                <span>{user.guardianName}</span>
              </DataRow>
              {user.guardianRelationship && (
                <DataRow label={t("guardianRelationship")}>
                  <span>{user.guardianRelationship}</span>
                </DataRow>
              )}
              {user.guardianTaxId && (
                <DataRow label={t("guardianTaxId")}>
                  <div
                    className={`flex items-center gap-2 group ${isAdmin && !revealedValues.guardianTaxId ? "cursor-pointer" : ""}`}
                    onClick={() => isAdmin && openRevealVault("guardianTaxId")}
                  >
                    <span className={revealedValues.guardianTaxId ? "font-mono text-xs" : ""}>
                      {revealedValues.guardianTaxId
                        ? revealedValues.guardianTaxId
                        : `•••.•••.${user.guardianTaxId?.slice(-4, -2)}-${user.guardianTaxId?.slice(-2)}`}
                    </span>
                    {isAdmin && !revealedValues.guardianTaxId && (
                      <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </DataRow>
              )}
              {user.guardianCellphone && (
                <DataRow label={t("guardianCellphone")}>
                  <div
                    className={`flex items-center gap-2 group ${isAdmin && !revealedValues.guardianCellphone ? "cursor-pointer" : ""}`}
                    onClick={() => isAdmin && openRevealVault("guardianCellphone")}
                  >
                    <span className={revealedValues.guardianCellphone ? "font-mono text-xs" : ""}>
                      {revealedValues.guardianCellphone
                        ? revealedValues.guardianCellphone
                        : `(••) •••••-${user.guardianCellphone?.slice(-4)}`}
                    </span>
                    {isAdmin && !revealedValues.guardianCellphone && (
                      <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </DataRow>
              )}
            </>
          )}
          {user.taxId && (
            <DataRow label={t("taxId")}>
              <div
                className={`flex items-center gap-2 group ${isAdmin && !revealedValues.taxId ? "cursor-pointer" : ""}`}
                onClick={() => isAdmin && openRevealVault("taxId")}
              >
                <span
                  className={revealedValues.taxId ? "font-mono text-xs" : ""}
                >
                  {revealedValues.taxId
                    ? revealedValues.taxId
                    : `•••.•••.${user.taxId?.slice(-4, -2)}-${user.taxId?.slice(-2)}`}
                </span>
                {isAdmin && !revealedValues.taxId && (
                  <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </DataRow>
          )}

          {user.role === "teacher" && (
            <>
              {user.businessTaxId && (
                <DataRow label={t("businessTaxId")}>
                  <div
                    className={`flex items-center gap-2 group ${isAdmin && !revealedValues.businessTaxId ? "cursor-pointer" : ""}`}
                    onClick={() => isAdmin && openRevealVault("businessTaxId")}
                  >
                    <span
                      className={
                        revealedValues.businessTaxId ? "font-mono text-xs" : ""
                      }
                    >
                      {revealedValues.businessTaxId
                        ? revealedValues.businessTaxId
                        : `••.•••.•••/••••-${user.businessTaxId?.slice(-2)}`}
                    </span>
                    {isAdmin && !revealedValues.businessTaxId && (
                      <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </DataRow>
              )}
              {user.pixKey && (
                <DataRow label={t("pixKey")}>
                  <div
                    className={`flex items-center gap-2 group ${isAdmin && !revealedValues.pixKey ? "cursor-pointer" : ""}`}
                    onClick={() => isAdmin && openRevealVault("pixKey")}
                  >
                    <span
                      className={
                        revealedValues.pixKey ? "font-mono text-xs" : ""
                      }
                    >
                      {revealedValues.pixKey
                        ? revealedValues.pixKey
                        : `••••••••${user.pixKey?.slice(-4)}`}
                    </span>
                    {isAdmin && !revealedValues.pixKey && (
                      <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </DataRow>
              )}
              {user.pixType && (
                <DataRow label={t("pixType")}>
                  <Badge
                    variant="outline"
                    className="text-[10px] uppercase font-black tracking-tighter"
                  >
                    {user.pixType}
                  </Badge>
                </DataRow>
              )}
            </>
          )}
          {user.role === "teacher" && (
            <DataRow label={t("hourlyRate")}>
              <div className="flex items-center gap-3 justify-end">
                <span className="font-black text-primary text-base">
                  {(user.teacherHourlyRate / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
                {isAdmin && (
                  <Vault>
                    <VaultTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-md border-border/50 hover:bg-primary/5 hover:text-primary transition-all"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </VaultTrigger>
                    <VaultContent>
                      <VaultHeader>
                        <VaultTitle>{t("editHourlyRate")}</VaultTitle>
                      </VaultHeader>
                      <form
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onSubmit={rateForm.handleSubmit(onUpdateRate as any)}
                        className="space-y-4 p-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="rate">{t("rateInReais")}</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            className="input"
                            {...rateForm.register("rate", {
                              valueAsNumber: true,
                            })}
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full font-bold"
                          disabled={isUpdating}
                        >
                          {t("saveChanges")}
                        </Button>
                      </form>
                    </VaultContent>
                  </Vault>
                )}
              </div>
            </DataRow>
          )}

          {user.role === "student" && (
            <DataRow label={t("studyingLanguages")}>
              <div className="flex flex-col items-end gap-2">
                <div className="flex flex-wrap gap-2 justify-end">
                  {isAdmin ? (
                    availableLanguages.length > 0 ? (
                      availableLanguages.map((lang) => (
                        <div
                          key={lang.id}
                          className="flex items-center space-x-2 px-2 py-1 hover:bg-primary/5 transition-colors"
                        >
                          <Checkbox
                            id={`lang-${lang.id}`}
                            checked={user.languages?.includes(lang.code)}
                            onCheckedChange={() =>
                              handleLanguageToggle(lang.code)
                            }
                            disabled={isTogglingLanguage}
                            className="h-3.5 w-3.5"
                          />
                          <label
                            htmlFor={`lang-${lang.id}`}
                            className="text-[10px] font-black uppercase tracking-tight cursor-pointer select-none"
                          >
                            {lang.code}
                          </label>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground animate-pulse">
                        {t("loadingLanguages")}
                      </span>
                    )
                  ) : user.languages && user.languages.length > 0 ? (
                    user.languages.map((langId) => (
                      <Badge
                        key={langId}
                        variant="secondary"
                        className="text-[9px] font-black uppercase py-0 px-1.5 h-4"
                      >
                        {langId}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-bold italic">
                      {t("noLanguagesSelected")}
                    </span>
                  )}
                </div>
              </div>
            </DataRow>
          )}
        </div>
      </div>

      {/* Security Vault for revealing data */}
      <Vault open={isVaultOpen} onOpenChange={setIsVaultOpen}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("securityConfirmation")}</VaultTitle>
          </VaultHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t("adminPasswordPlaceholder")}
              </Label>
              <VaultInput
                type="password"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleReveal()}
              />
            </div>
          </div>
          <VaultFooter>
            <VaultPrimaryButton
              onClick={handleReveal}
              disabled={isRevealing || !adminPassword}
            >
              {isRevealing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              {t("confirm")}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
