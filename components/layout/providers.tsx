"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { PwaHandler } from "./pwa-handler";
import { NotificationPermissionVault } from "@/modules/notification/_components/NotificationPermissionVault";
import { PwaVault } from "@/modules/pwa/_components/PwaVault";

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  themeMode: string;
}

export function Providers({ children, locale, messages, themeMode }: ProvidersProps) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="America/Sao_Paulo">
      <ThemeProvider
        attribute="class"
        defaultTheme={themeMode}
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <PwaHandler />
        <NotificationPermissionVault />
        <PwaVault />
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
