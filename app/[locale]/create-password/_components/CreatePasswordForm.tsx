"use client"
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Lock, Mail, Check, Eye, EyeOff } from "lucide-react";
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

  // Password visibility states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const password = useWatch({
    control,
    name: "password",
    defaultValue: "",
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
      // Dev bypass for easy UI previewing and testing
      if (process.env.NODE_ENV === "development" && (oobCode === "dev" || oobCode === "debug")) {
        setEmail("dev-preview@fluencylab.com");
        setCodeValid(true);
        setLoading(false);
        return;
      }

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
      router.push(`/hub`);
    } else {
      notify.error(result.error || t("Auth.errors.googleError"));
    }
  };

  // Password requirements checklist configuration
  const requirements = [
    {
      id: "length",
      label: t("Auth.requirements.minLength") || "Mínimo de 8 caracteres",
      test: (val: string) => val.length >= 8,
    },
    {
      id: "uppercase",
      label: t("Auth.requirements.uppercase") || "Uma letra maiúscula (A-Z)",
      test: (val: string) => /[A-Z]/.test(val),
    },
    {
      id: "lowercase",
      label: t("Auth.requirements.lowercase") || "Uma letra minúscula (a-z)",
      test: (val: string) => /[a-z]/.test(val),
    },
    {
      id: "number",
      label: t("Auth.requirements.number") || "Pelo menos um número (0-9)",
      test: (val: string) => /[0-9]/.test(val),
    },
    {
      id: "special",
      label: t("Auth.requirements.special") || "Um caractere especial (ex: @, #, $)",
      test: (val: string) => /[^A-Za-z0-9]/.test(val),
    },
  ];

  const metCount = requirements.filter((req) => req.test(password)).length;

  const getStrengthInfo = (count: number, hasPassword = false) => {
    if (!hasPassword) {
      return {
        label: t("Auth.strength.empty") || "Senha vazia",
        color: "bg-gray-200 dark:bg-gray-800",
        textColor: "text-gray-400",
      };
    }
    switch (count) {
      case 1:
        return {
          label: t("Auth.strength.veryWeak") || "Muito Fraca",
          color: "bg-red-500",
          textColor: "text-red-500",
        };
      case 2:
        return {
          label: t("Auth.strength.weak") || "Fraca",
          color: "bg-orange-500",
          textColor: "text-orange-500",
        };
      case 3:
        return {
          label: t("Auth.strength.medium") || "Média",
          color: "bg-yellow-500",
          textColor: "text-yellow-500",
        };
      case 4:
        return {
          label: t("Auth.strength.strong") || "Forte",
          color: "bg-emerald-400",
          textColor: "text-emerald-400",
        };
      case 5:
        return {
          label: t("Auth.strength.veryStrong") || "Muito Forte",
          color: "bg-emerald-600",
          textColor: "text-emerald-600",
        };
      default:
        return {
          label: t("Auth.strength.veryWeak") || "Muito Fraca",
          color: "bg-red-500",
          textColor: "text-red-500",
        };
    }
  };

  const strength = getStrengthInfo(metCount, password.length > 0);

  return (
    <div className="min-h-screen min-w-screen bg-slate-200 dark:bg-slate-950 flex items-center justify-center p-4">
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
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md" />
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-md" />
              <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-md" />
            </div>
          ) : !codeValid ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="rounded-md bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30">
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
                        className={`pl-10 h-11 rounded-md bg-gray-50 border-gray-200 ${resendErrors.email ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
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
                <Alert className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30 rounded-md">
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
                <div className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-gray-800 p-3 rounded-md text-center">
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
                    type={showPassword ? "text" : "password"}
                    placeholder={t("Auth.placeholders.passwordMin") || "Mínimo de 8 caracteres"}
                    className={`pl-10 pr-10 h-11 ${errors.password ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs font-medium text-destructive ml-1">
                    {tv(errors.password.message?.split(".")[1] || "") || errors.password.message}
                  </p>
                )}

                {/* Password Strength Indicator & Real-time checklist */}
                <div className="pt-1.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] leading-none">
                    <span className="text-muted-foreground">
                      {t("Auth.labels.strength") || "Força da senha:"}
                    </span>
                    <span className={`font-bold transition-colors duration-300 ${strength.textColor}`}>
                      {strength.label}
                    </span>
                  </div>

                  {/* 5-segment Progress Bar */}
                  <div className="flex gap-1.5 h-1.5 w-full">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          i < metCount ? strength.color : "bg-slate-300 dark:bg-slate-800"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Criteria Checklist */}
                  <ul className="space-y-1.5 text-xs bg-slate-200 dark:bg-slate-900/40 p-3 rounded-md border border-slate-100 dark:border-slate-900/80 transition-all duration-300">
                    {requirements.map((req) => {
                      const isMet = req.test(password);
                      return (
                        <li
                          key={req.id}
                          className={`flex items-center gap-2 transition-colors duration-300 ${
                            isMet
                              ? "text-emerald-600 dark:text-emerald-400 font-medium"
                              : password
                              ? "text-rose-500/80 dark:text-rose-400/80"
                              : "text-muted-foreground"
                          }`}
                        >
                          <AnimatePresence mode="wait">
                            <motion.span
                              key={isMet ? "checked" : "unchecked"}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                              className="flex-shrink-0"
                            >
                              {isMet ? (
                                <Check className="h-3.5 w-3.5 stroke-[3px] text-emerald-500" />
                              ) : (
                                <div className={`h-1.5 w-1.5 rounded-full ${password ? "bg-rose-400/70" : "bg-muted-foreground/60"}`} />
                              )}
                            </motion.span>
                          </AnimatePresence>
                          <span>{req.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  {t("Auth.labels.confirmPassword") || "Confirmar senha"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder={t("Auth.placeholders.repeatPassword") || "Repita a senha"}
                    className={`pl-10 pr-10 h-11 ${errors.confirmPassword ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive ml-1">
                    {tv(errors.confirmPassword.message?.split(".")[1] || "") || errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-md">
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

              <div className="relative flex items-center gap-4 text-gray-400 my-4 uppercase text-[10px] font-bold tracking-widest before:h-px before:flex-1 before:bg-gray-200 after:h-px after:flex-1 after:bg-gray-200">
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
                  loading="eager"
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