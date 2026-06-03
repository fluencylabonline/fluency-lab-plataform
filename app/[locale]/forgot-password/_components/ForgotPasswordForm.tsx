"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendCustomPasswordResetAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { forgotPasswordSchema, type ForgotPasswordValues } from "@/modules/user/user.schema";

export function ForgotPasswordForm() {
  const t = useTranslations("Auth");
  const tv = useTranslations("Validation");
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as "pt" | "en") || "pt";

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<ForgotPasswordValues> = async (data) => {
    setIsLoading(true);

    const result = await sendCustomPasswordResetAction({ email: data.email, locale });

    if (result?.data?.success) {
      setSubmittedEmail(data.email);
      setIsSuccess(true);
      notify.success(t("passwordResetSent") || "Email de redefinição de senha enviado com sucesso!");
    } else {
      const errorKey = result?.data?.error;
      notify.error(errorKey ? t(`errors.${errorKey}`) : t("error"));
    }

    setIsLoading(false);
  };


  if (isSuccess) {
    return (
      <div className="text-center space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {t("checkYourEmail") || "Verifique seu e-mail"}
          </h2>
          <p className="text-muted-foreground">
            {t("passwordResetSentDescription") || "Enviamos instruções para redefinir sua senha."}
          </p>
          <div className="bg-muted p-2 rounded text-sm text-foreground/80 font-medium">
            {submittedEmail}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push(`/signin`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToLogin") || "Voltar para Login"}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("forgotPassword")}
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {t("forgotPasswordSubtitle") || "Não se preocupe, nós ajudamos você."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium leading-none">
            {t("email")}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
              className={`pl-10 h-12 ${errors.email ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>
          {errors.email && (
            <p className="text-xs font-medium text-destructive">
              {tv(errors.email.message?.split(".")[1] || "") || errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          size="lg"
          className="w-full mt-2"
        >
          {isLoading ? t("loading") || "Carregando..." : (t("resetPassword") || "Enviar instruções")}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => router.push(`/signin`)}
          disabled={isLoading}
        >
          {t("backToLogin") || "Voltar para Login"}
        </Button>
      </form>
    </div>
  );
}
