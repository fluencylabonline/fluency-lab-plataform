import { getLocale, getTranslations } from "next-intl/server";
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import BackgroundLogin from "@/public/backgrounds/login";
import { ForgotPasswordForm } from "./_components/ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const locale = await getLocale();
  const t = await getTranslations("Auth");

  return (
    <div className="min-h-dvh w-full bg-background dark:bg-gray-950 flex items-center justify-center p-4 sm:p-6 relative">
      <BackButton
        href={`/${locale}/signin`}
        ariaLabel={t("back")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10"
      />
      <div className="flex flex-row gap-2 absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-4xl bg-slate-300/50 dark:bg-gray-900 rounded-xl overflow-hidden mt-8">
        <div className="flex flex-col lg:flex-row">
          <div className="hidden lg:flex flex-col items-center justify-center lg:w-1/2 bg-gray-100 dark:bg-gray-800 p-8 lg:p-12 relative min-h-[300px] lg:min-h-[500px]">
            <BackgroundLogin />
          </div>

          <div className="w-full lg:w-1/2 p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
            <ForgotPasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
