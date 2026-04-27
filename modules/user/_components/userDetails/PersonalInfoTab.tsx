"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Mail, Phone, Calendar, Edit2, Eye, CheckCircle2, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { DataRow } from "./UserDetailsPrimitives";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultTrigger,
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { Label } from "@/components/ui/label";
import type { User } from "../../user.schema";
import { Badge } from "@/components/ui/badge";
import { revealSensitiveDataAction } from "../../user.actions";

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

  const [revealingField, setRevealingField] = React.useState<"cellphone" | "taxId" | "businessTaxId" | "pixKey" | null>(null);
  const [adminPassword, setAdminPassword] = React.useState("");
  const [isRevealing, setIsRevealing] = React.useState(false);
  const [revealedValues, setRevealedValues] = React.useState<Record<string, string>>({});
  const [isVaultOpen, setIsVaultOpen] = React.useState(false);

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
        setRevealedValues(prev => ({
          ...prev,
          [revealingField]: result.data!.data as string
        }));
        setIsVaultOpen(false);
        setAdminPassword("");
        notify.success(t("success"));
      } else {
        notify.error(result?.data?.error === "authError" ? t("authError") : t("error"));
      }
    } catch {
      notify.error(t("error"));
    } finally {
      setIsRevealing(false);
    }
  };

  const openRevealVault = (field: "cellphone" | "taxId" | "businessTaxId" | "pixKey") => {
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
            <AvatarFallback className="rounded-md text-sm font-black bg-primary/5 text-primary">
              {user.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-black text-sm tracking-tight truncate">{user.name}</p>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
              {tRoles(user.role as "admin" | "teacher" | "student" | "manager")}
            </p>
            <Badge variant={user.isActive ? "default" : "secondary"} className="mt-2 text-[9px] h-4 font-black">
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
                  {revealedValues.cellphone ? revealedValues.cellphone : `(••) •••••-${user.cellphone?.slice(-4)}`}
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
          {user.taxId && (
            <DataRow label={t("taxId")}>
              <div
                className={`flex items-center gap-2 group ${isAdmin && !revealedValues.taxId ? "cursor-pointer" : ""}`}
                onClick={() => isAdmin && openRevealVault("taxId")}
              >
                <span className={revealedValues.taxId ? "font-mono text-xs" : ""}>
                  {revealedValues.taxId ? revealedValues.taxId : `•••.•••.${user.taxId?.slice(-4, -2)}-${user.taxId?.slice(-2)}`}
                </span>
                {isAdmin && !revealedValues.taxId && <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
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
                    <span className={revealedValues.businessTaxId ? "font-mono text-xs" : ""}>
                      {revealedValues.businessTaxId ? revealedValues.businessTaxId : `••.•••.•••/••••-${user.businessTaxId?.slice(-2)}`}
                    </span>
                    {isAdmin && !revealedValues.businessTaxId && <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </DataRow>
              )}
              {user.pixKey && (
                <DataRow label={t("pixKey")}>
                  <div
                    className={`flex items-center gap-2 group ${isAdmin && !revealedValues.pixKey ? "cursor-pointer" : ""}`}
                    onClick={() => isAdmin && openRevealVault("pixKey")}
                  >
                    <span className={revealedValues.pixKey ? "font-mono text-xs" : ""}>
                      {revealedValues.pixKey ? revealedValues.pixKey : `••••••••${user.pixKey?.slice(-4)}`}
                    </span>
                    {isAdmin && !revealedValues.pixKey && <Eye className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                </DataRow>
              )}
              {user.pixType && (
                <DataRow label={t("pixType")}>
                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter">
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
                      <Button variant="outline" size="icon" className="h-7 w-7 rounded-md border-border/50 hover:bg-primary/5 hover:text-primary transition-all">
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
                            {...rateForm.register("rate", { valueAsNumber: true })}
                          />
                        </div>
                        <Button type="submit" className="w-full font-bold" disabled={isUpdating}>
                          {t("saveChanges")}
                        </Button>
                      </form>
                    </VaultContent>
                  </Vault>
                )}
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
              <Input
                type="password"
                className="input"
                placeholder="••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleReveal()}
              />
            </div>
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700 font-black text-xs uppercase tracking-widest py-6"
              onClick={handleReveal}
              disabled={isRevealing || !adminPassword}
            >
              {isRevealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {t("confirm")}
            </Button>
          </div>
        </VaultContent>
      </Vault>
    </div>
  );
}
