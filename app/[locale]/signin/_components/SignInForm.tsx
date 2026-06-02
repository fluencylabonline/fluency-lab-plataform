"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { notify } from "@/components/ui/toaster";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { signInSchema, type SignInValues } from "@/modules/user/user.schema";
import { TransitionAnimation } from "@/components/ui/transition-animation";
import { VerifyMfaVault } from "./VerifyMfaVault";
import { LockKeyholeIcon, type LockKeyholeIconHandle } from "@/components/animated-icons/lock-keyhole";

export function SignInForm() {
  const t = useTranslations("Auth");
  const tv = useTranslations("Validation");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const [isLoading, setIsLoading] = useState(false);
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const iconRef = useRef<LockKeyholeIconHandle>(null);

  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleLoginSuccess = () => {
    setIsSuccess(true);
    setShowMfa(false);
    setTimeout(() => {
      router.push(redirectTo || `/hub`);
      router.refresh();
    }, 3500);
  };

  const onSubmit: SubmitHandler<SignInValues> = async (data) => {
    setIsLoading(true);
    setIsCredentialsLoading(true);

    const signInResult = await authClient.signIn(data.email, data.password, data.rememberMe);

    if (!signInResult.success) {
      if (signInResult.error) {
        notify.error(t(signInResult.error) || t("error") || "Erro ao fazer login");
      }
      setIsLoading(false);
      setIsCredentialsLoading(false);
      return;
    }

    const user = signInResult.data!;
    const sessionResult = await authClient.createSession(user, data.rememberMe);

    if (sessionResult.mfaRequired) {
      setShowMfa(true);
      setIsLoading(false);
      setIsCredentialsLoading(false);
      return;
    }

    if (!sessionResult.success) {
      const errorMsg = sessionResult.error === "notInvited"
        ? t("notInvited")
        : sessionResult.error === "accountSuspended"
        ? t("accountSuspended")
        : (t("error") || "Erro ao criar sessão");

      notify.error(errorMsg);
      setIsLoading(false);
      setIsCredentialsLoading(false);
      return;
    }

    handleLoginSuccess();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    const rememberMe = getValues("rememberMe");
    const signInResult = await authClient.signInWithGoogle(rememberMe);

    if (!signInResult.success) {
      if (signInResult.error) {
        notify.error(t(signInResult.error) || t("error") || "Erro ao fazer login com Google");
      }
      setIsLoading(false);
      return;
    }

    const user = signInResult.data!;
    const sessionResult = await authClient.createSession(user, rememberMe);

    if (sessionResult.mfaRequired) {
      setShowMfa(true);
      setIsLoading(false);
      return;
    }

    if (!sessionResult.success) {
      const errorMsg = sessionResult.error === "notInvited"
        ? t("notInvited")
        : sessionResult.error === "accountSuspended"
        ? t("accountSuspended")
        : (t("error") || "Erro ao criar sessão");

      notify.error(errorMsg);
      setIsLoading(false);
      return;
    }

    notify.success(t("welcomeTitle") || "Login bem-sucedido!");
    handleLoginSuccess();
  };

  return (
    <div className="max-w-md mx-auto w-full">
      {isSuccess && <TransitionAnimation />}
      
      <h2 className="text-3xl lg:text-4xl font-bold text-text mb-2">
        {t("signIn") || "Entrar"}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        {t("welcomeSubtitle") || "Bem-vindo de volta!"}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <Input
            type="email"
            {...register("email")}
            placeholder={t("email") || "Email"}
            autoComplete="username"
            className={`h-12 scroll-mt-28 ${errors.email ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-xs font-medium text-destructive">
              {tv(errors.email.message?.split(".")[1] || "") || errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Input
            type="password"
            {...register("password")}
            placeholder={t("password") || "Senha"}
            autoComplete="current-password"
            className={`h-12 scroll-mt-28 ${errors.password ? "border-destructive! focus-visible:ring-destructive!" : ""}`}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-xs font-medium text-destructive">
              {tv(errors.password.message?.split(".")[1] || "") || errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 py-2">
          <Controller
            name="rememberMe"
            control={control}
            render={({ field }) => (
              <Checkbox
                id="rememberMe"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            )}
          />
          <Label htmlFor="rememberMe" className="text-sm font-medium cursor-pointer">
            {t("rememberMe") || "Permanecer logado"}
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full mt-4"
          size="lg"
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
        >
          {isCredentialsLoading ? (
            <>
              <Spinner aria-hidden="true" className="mr-2 h-4 w-4" />
            </>
          ) : (
            <div className="flex flex-row items-center justify-center">
              <LockKeyholeIcon ref={iconRef} className="mr-2" size={20} />
              <span>{t("signIn") || "Entrar"}</span>
            </div>
          )}
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-100 dark:bg-gray-900 text-gray-500 rounded-full">
              {t("orContinueWithGoogle") || "Ou continue com o Google"}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-12"
          size="lg"
        >
          <Image
            src="/icons/google.svg"
            alt="Google Icon"
            width={20}
            height={20}
            className="mr-2"
            loading="eager"
          />
          {t("signInWithGoogle") || "Entrar com Google"}
        </Button>
      </form>

      <div className="flex flex-col items-center mt-8">
        <a
          href={`/forgot-password`}
          className="text-sm text-primary hover:underline font-medium"
        >
          {t("forgotPassword") || "Esqueci minha senha"}
        </a>
      </div>

      <VerifyMfaVault 
        open={showMfa}
        onOpenChange={setShowMfa}
        onSuccess={handleLoginSuccess}
        rememberMe={getValues("rememberMe")}
      />
    </div>
  );
}
