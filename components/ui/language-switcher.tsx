"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "./dropdown-menu";
import { Button } from "./button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations("Common");

  const toggleLocale = (newLocale: string) => {
    // With localePrefix:'never', we set the NEXT_LOCALE cookie directly 
    // and reload so the middleware picks up the new locale without path conflicts.
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    window.location.reload();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t("switchLanguage")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toggleLocale("pt")}>
          Português (BR)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleLocale("en")}>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
