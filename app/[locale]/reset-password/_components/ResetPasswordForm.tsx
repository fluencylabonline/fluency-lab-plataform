"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Lock, Check, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { sendPasswordResetConfirmationAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { resetPasswordSchema, type ResetPasswordValues } from "@/modules/user/user.schema";

export function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const tv = useTranslations("Validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as "pt" | "en") || "pt";
  const oobCode = searchParams.get("oobCode");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Validation states - initialized directly using the presence of oobCode to avoid synchronous state updates in useEffect
  const [isValidating, setIsValidating] = useState(() => !oobCode ? false : true);
  const [email, setEmail] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(() => !oobCode ? "invalidLink" : null);

  // Validate the code on mount (only runs if oobCode is present, avoiding synchronous state updates in effect)
  useEffect(() => {
    if (!oobCode) return;

    authClient.verifyPasswordReset(oobCode).then((result) => {
      if (result.success) {
        if (result.data) {
          setEmail(result.data);
        } else {
          setValidationError("invalidLink");
        }
      } else {
        setValidationError(result.error || "invalidLink");
      }
      setIsValidating(false);
    });
  }, [oobCode]);

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
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

  // Password requirements checklist configuration
  const requirements = [
    {
      id: "length",
      label: t("requirements.minLength") || "Mínimo de 8 caracteres",
      test: (val: string) => val.length >= 8,
    },
    {
      id: "uppercase",
      label: t("requirements.uppercase") || "Uma letra maiúscula (A-Z)",
      test: (val: string) => /[A-Z]/.test(val),
    },
    {
      id: "lowercase",
      label: t("requirements.lowercase") || "Uma letra minúscula (a-z)",
      test: (val: string) => /[a-z]/.test(val),
    },
    {
      id: "number",
      label: t("requirements.number") || "Pelo menos um número (0-9)",
      test: (val: string) => /[0-9]/.test(val),
    },
    {
      id: "special",
      label: t("requirements.special") || "Um caractere especial (ex: @, #, $)",
      test: (val: string) => /[^A-Za-z0-9]/.test(val),
    },
  ];

  const metCount = requirements.filter((req) => req.test(password)).length;

  const getStrengthInfo = (count: number, hasPassword = false) => {
    if (!hasPassword) {
      return {
        label: t("strength.empty") || "Senha vazia",
        color: "bg-gray-200 dark:bg-gray-800",
        textColor: "text-gray-400",
      };
    }
    switch (count) {
      case 1:
        return {
          label: t("strength.veryWeak") || "Muito Fraca",
          color: "bg-red-500",
          textColor: "text-red-500",
        };
      case 2:
        return {
          label: t("strength.weak") || "Fraca",
          color: "bg-orange-500",
          textColor: "text-orange-500",
        };
      case 3:
        return {
          label: t("strength.medium") || "Média",
          color: "bg-yellow-500",
          textColor: "text-yellow-500",
        };
      case 4:
        return {
          label: t("strength.strong") || "Forte",
          color: "bg-emerald-400",
          textColor: "text-emerald-400",
        };
      case 5:
        return {
          label: t("strength.veryStrong") || "Muito Forte",
          color: "bg-emerald-600",
          textColor: "text-emerald-600",
        };
      default:
        return {
          label: t("strength.veryWeak") || "Muito Fraca",
          color: "bg-red-500",
          textColor: "text-red-500",
        };
    }
  };

  const strength = getStrengthInfo(metCount, password.length > 0);

  const onSubmit: SubmitHandler<ResetPasswordValues> = async (data) => {
    if (!oobCode) {
      notify.error(t("errors.invalidLink") || "Link inválido ou expirado.");
      return;
    }

    setIsLoading(true);

    const result = await authClient.confirmPasswordReset(oobCode, data.password);

    if (result.success) {
      setIsSuccess(true);
      notify.success(t("passwordCreated") || "Senha redefinida com sucesso!");
      
      // Enviar e-mail de confirmação
      if (email) {
        sendPasswordResetConfirmationAction({ email, locale });
      }
    } else {
      notify.error(result.error ? t(`errors.${result.error}`) : t("error"));
    }

    setIsLoading(false);
  };

  // State: Loading/Validating
  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-pulse max-w-md mx-auto w-full">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded mt-6" />
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded mt-4" />
      </div>
    );
  }

  // State: Validation Error (Expired or Invalid Link)
  if (validationError) {
    return (
      <div className="text-center space-y-6 animate-in fade-in duration-300 max-w-md mx-auto w-full">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <Lock className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">
            {t("errors.invalidLinkTitle") || "Link inválido ou expirado"}
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {validationError === "linkExpired"
              ? (t("errors.linkExpired") || "Este link de redefinição de senha já expirou. Por favor, solicite um novo link.")
              : (t("errors.invalidLink") || "Este link de redefinição de senha é inválido ou já foi utilizado.")}
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/forgot-password`)} className="w-full mt-4 h-12" size="lg">
          {t("buttons.resendLink") || "Solicitar Novo Link"}
        </Button>
      </div>
    );
  }

  // State: Success
  if (isSuccess) {
    return (
      <div className="text-center space-y-6 max-w-md mx-auto w-full">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">{t("passwordCreated")}</h2>
        <Button onClick={() => router.push(`/${locale}/signin`)} className="w-full h-12" size="lg">
          {t("signIn") || "Entrar"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md mx-auto w-full">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">{t("resetPassword") || "Resetar senha"}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {t("createPasswordSubtitle") || "Escolha uma nova senha forte para"} <strong className="text-foreground">{email}</strong>.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("password") || "Senha"}</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type={showPassword ? "text" : "password"}
            {...register("password")}
            className={`pl-10 pr-10 h-12 ${errors.password ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            autoComplete="new-password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs font-medium text-destructive">
            {tv(errors.password.message?.split(".")[1] || "") || errors.password.message}
          </p>
        )}

        {/* Password Strength Indicator & Real-time checklist */}
        <div className="pt-1.5 space-y-2">
          <div className="flex items-center justify-between text-[11px] leading-none">
            <span className="text-muted-foreground">
              {t("labels.strength") || "Força da senha:"}
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
        <label className="text-sm font-medium">{t("confirmPassword") || "Confirmar senha"}</label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            type={showConfirmPassword ? "text" : "password"}
            {...register("confirmPassword")}
            className={`pl-10 pr-10 h-12 ${errors.confirmPassword ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            autoComplete="new-password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
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
