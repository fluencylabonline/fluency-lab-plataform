"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { PwaHandler } from "./pwa-handler";
import { NotificationPermissionVault } from "@/modules/notification/_components/NotificationPermissionVault";
import { PwaVault } from "@/modules/pwa/_components/PwaVault";
import { ThemeColorUpdater } from "./theme-color-updater";
// import { PwaSplash } from "./pwa-splash"; // Not working for now

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  themeMode: string;
}

export function Providers({ children, locale, messages, themeMode }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={themeMode}
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider messages={messages} locale={locale} timeZone="America/Sao_Paulo">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster />
        <PwaHandler />
        <ThemeColorUpdater isDarkMode={themeMode === 'dark'} />
        {/* <PwaSplash /> Not working for now */}
        <NotificationPermissionVault />
        <PwaVault />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
