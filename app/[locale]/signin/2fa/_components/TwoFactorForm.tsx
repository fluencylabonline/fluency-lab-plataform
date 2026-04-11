"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import { twoFactorSchema, type TwoFactorValues } from "@/modules/user/user.schema";

export function TwoFactorForm({ email }: { email?: string }) {
  const t = useTranslations("Auth");
  const tv = useTranslations("Validation");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TwoFactorValues>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit: SubmitHandler<TwoFactorValues> = async (data) => {
    setIsLoading(true);

    try {
      //TODO: Implementar lógica real de 2FA
      console.log("Verifying code:", data.code);

      // Simulate success
      notify.success(t("welcomeTitle") || "Bem-vindo!");
      router.push(`/hub`);
    } catch (err) {
      const error = err as Error;
      notify.error(error.message || "Invalid 2FA code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t("twoFactorTitle") || "Two-Factor Verification"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("twoFactorSubtitle") || "Enter the 6-digit code from your authenticator app"}
        </p>
        {email ? (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {(t("signingInAs") || "Signing in as:") + " " + email}
          </p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Input
            type="text"
            {...register("code")}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setValue("code", val, { shouldValidate: true });
            }}
            placeholder="000000"
            maxLength={6}
            className={`text-center tracking-widest h-12 text-lg ${errors.code ? "border-destructive focus-visible:ring-destructive" : ""}`}
            disabled={isLoading}
            autoFocus
          />
          {errors.code && (
            <p className="text-xs font-medium text-destructive text-center">
              {tv(errors.code.message?.split(".")[1] || "") || errors.code.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          size="lg"
          className="w-full"
        >
          {isLoading
            ? t("verifying") || "Verificando..."
            : t("verifyButton") || "Verificar"}
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              try {
                sessionStorage.removeItem("temp-2fa-data");
              } catch { }
              router.push(`/signin`);
            }}
            className="text-sm"
            disabled={isLoading}
          >
            {t("useDifferentAccount") || "Use a different account"}
          </Button>
        </div>
      </form>
    </div>
  );
}
