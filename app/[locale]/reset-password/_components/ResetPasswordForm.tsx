"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { confirmPasswordReset } from "firebase/auth";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock } from "lucide-react";

import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import { resetPasswordSchema, type ResetPasswordValues } from "@/modules/user/user.schema";

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const tv = useTranslations("Validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (data) => {
    if (!oobCode) {
      notify.error("Invalid or expired reset link.");
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setIsSuccess(true);
      notify.success(t("passwordCreated") || "Password reset successfully!");
    } catch (error) {
      console.error("[ResetPasswordForm] Error:", error);
      notify.error(t("error") || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t("passwordCreated")}</h2>
        <Button onClick={() => router.push(`/signin`)} className="w-full">
          {t("signIn") || "Entrar"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">{t("resetPassword") || "Resetar senha"}</h2>
        <p className="text-muted-foreground">{t("createPasswordSubtitle") || "Escolha uma nova senha forte."}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("password") || "Senha"}</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="password"
            {...register("password")}
            className={`pl-10 h-12 ${errors.password ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive">
            {tv(errors.password.message?.split(".")[1] || "") || errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("confirmPassword") || "Confirmar senha"}</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type="password"
            {...register("confirmPassword")}
            className={`pl-10 h-12 ${errors.confirmPassword ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-xs font-medium text-destructive">
            {tv(errors.confirmPassword.message?.split(".")[1] || "") || errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-12 mt-2" size="lg">
        {isLoading ? t("loading") || "Carregando..." : t("resetPassword") || "Resetar senha"}
      </Button>
    </form>
  );
}
