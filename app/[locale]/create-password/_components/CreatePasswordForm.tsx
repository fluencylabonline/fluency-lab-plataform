"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { notify } from "@/components/ui/toaster";
import { resetPasswordSchema, requestNewInviteSchema, RequestNewInviteValues, ResetPasswordValues } from "@/modules/user/user.schema";
import { requestNewInviteAction } from "@/modules/user/user.actions";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

export function CreatePasswordForm() {
  const t = useTranslations();
  const tv = useTranslations("Validation");
  const searchParams = useSearchParams();
  const router = useRouter();

  const oobCode = searchParams.get("oobCode");

  const [codeValid, setCodeValid] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(!!oobCode);
  const [error, setError] = useState<string>(!oobCode ? t("Auth.errors.invalidLink") : "");

  const [success, setSuccess] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register: registerResend,
    handleSubmit: handleSubmitResend,
    formState: { errors: resendErrors },
  } = useForm<RequestNewInviteValues>({
    resolver: zodResolver(requestNewInviteSchema),
    defaultValues: {
      email: "",
    },
  });

  const { execute: executeResend, isPending: resending, hasSucceeded: resendSuccess } = useAction(requestNewInviteAction, {
    onSuccess: ({ data }) => {
      if (data?.success) {
        notify.success(t("Auth.notifications.resendSuccess"));
      } else {
        const error = data?.error === "rateLimitExceeded" ? t("Auth.rateLimitExceeded") : t("Auth.error");
        setError(error);
        notify.error(error);
      }
    },
    onError: () => {
      notify.error(t("Auth.error"));
    }
  });

  useEffect(() => {
    if (!oobCode) return;

    const verifyCode = async () => {
      const result = await authClient.verifyPasswordReset(oobCode);
      if (result.success) {
        setEmail(result.data || "");
        setCodeValid(true);
      } else {
        if (result.error === "linkExpired") {
          setIsExpired(true);
          setError(t("Auth.errors.linkExpired"));
        } else {
          setError(t("Auth.errors.verificationError"));
        }
        setCodeValid(false);
      }
      setLoading(false);
    };

    verifyCode();
  }, [oobCode, t]);

  const handleResendLink = async (values: RequestNewInviteValues) => {
    executeResend({ email: values.email });
  };

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!oobCode) return;

    const result = await authClient.confirmPasswordReset(oobCode, values.password);

    if (result.success) {
      setSuccess(true);
      notify.success(t("Auth.notifications.passwordSetSuccess"));
    } else {
      const message = result.error ? t(`Auth.errors.${result.error}`) : t("Auth.errors.error");
      setError(message);
      notify.error(message);
    }
  };

  const handleGoogleSignIn = async () => {
    const result = await authClient.signInWithGoogle();
    if (result.success) {
      router.push(`/hub/profile`);
    } else {
      notify.error(result.error || t("Auth.errors.googleError"));
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center p-4">
      <div className="bg-slate-300/50 dark:bg-gray-900 w-full max-w-[500px] border-none rounded-md overflow-hidden">
        <div className="text-center space-y-2 pt-10 px-8">
          <div className="flex items-center justify-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">
            {t("Auth.createPassword.title") || "Definir sua senha"}
          </h3>
          <p className="text-gray-500">
            {t("Auth.createPassword.description") || "Crie sua senha de acesso para começar a usar a plataforma."}
          </p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            </div>
          ) : !codeValid ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-xl bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {isExpired && !resendSuccess && (
                <form onSubmit={handleSubmitResend(handleResendLink)} className="space-y-3 mt-4">
                  <p className="text-sm text-gray-500 text-center">
                    {t("Auth.createPassword.resendPrompt") || "Insira seu e-mail abaixo para enviarmos um novo link de acesso."}
                  </p>
                  <div className="space-y-1">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        placeholder={t("Auth.placeholders.email") || "Seu e-mail cadastrado"}
                        className={`pl-10 h-11 rounded-xl bg-gray-50 border-gray-200 ${resendErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        disabled={resending}
                        {...registerResend("email")}
                      />
                    </div>
                    {resendErrors.email && (
                      <p className="text-xs font-medium text-destructive ml-1">
                        {tv(resendErrors.email.message?.split(".")[1] || "") || resendErrors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={resending} className="w-full">
                    {resending ? t("Auth.loading") : t("Auth.buttons.resendLink")}
                  </Button>
                </form>
              )}

              {resendSuccess && (
                <Alert className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    {t("Auth.notifications.resendSuccess") || "Novo link enviado! Verifique sua caixa de entrada."}
                  </AlertDescription>
                </Alert>
              )}

              <Button onClick={() => router.push(`/signin`)} variant="ghost" className="w-full">
                {t("Auth.buttons.backToLogin") || "Voltar para Login"}
              </Button>
            </div>
          ) : success ? (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <p className="text-xl font-bold">{t("Auth.notifications.passwordSet") || "Senha definida!"}</p>
              </div>
              <p className="text-gray-500 text-sm">
                {t("Auth.createPassword.successMessage") || "Agora você já pode fazer login com sua nova senha e acessar sua conta."}
              </p>
              <Button onClick={() => router.push(`/signin`)} className="w-full">
                {t("Auth.buttons.goToLogin") || "Ir para o login"}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {email && (
                <div className="text-xs font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center">
                  {t("Auth.createPassword.creatingFor") || "Criando senha para:"}{" "}
                  <span className="text-gray-900 dark:text-gray-100 font-bold">{email}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t("Auth.labels.newPassword") || "Nova senha"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t("Auth.placeholders.passwordMin") || "Mínimo de 8 caracteres"}
                    className={`pl-10 h-11 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    {...register("password")}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive ml-1">
                    {tv(errors.password.message?.split(".")[1] || "") || errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t("Auth.labels.confirmPassword") || "Confirmar senha"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder={t("Auth.placeholders.repeatPassword") || "Repita a senha"}
                    className={`pl-10 h-11 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    {...register("confirmPassword")}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive ml-1">
                    {tv(errors.confirmPassword.message?.split(".")[1] || "") || errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
              >
                {t("Auth.buttons.setPassword") || "Definir minha senha"}
              </Button>

              <div className="relative flex items-center gap-4 text-gray-400 my-4 uppercase text-[10px] font-bold tracking-widest before:h-[1px] before:flex-1 before:bg-gray-200 after:h-[1px] after:flex-1 after:bg-gray-200">
                {t("Common.or") || "OU"}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                size="lg"
                className="w-full"
              >
                <Image
                  src="/icons/google.svg"
                  alt="Google Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />

                {t("Auth.signInWithGoogle") || "Entrar com Google"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}