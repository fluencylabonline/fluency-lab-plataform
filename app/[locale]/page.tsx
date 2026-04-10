
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { ColorSwitcher } from "@/components/ui/color-switcher";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default async function Home() {
  const t = await getTranslations("Auth");

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background font-sans text-center">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 gap-4">
        <ThemeSwitcher />
        <ColorSwitcher />
        <Avatar>
          <AvatarFallback name="User" />
        </Avatar>
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          {t("welcomeTitle")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("welcomeSubtitle")}
        </p>
        <Link href="/signin">Login</Link>
      </main>
    </div>
  );
}
