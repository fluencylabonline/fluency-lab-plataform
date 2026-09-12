"use client";

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { PwaHandler } from "./pwa-handler";
import { OfflineBanner } from "./offline-banner";
import { NotificationPermissionVault } from "@/modules/notification/_components/NotificationPermissionVault";
import { PwaVault } from "@/modules/pwa/_components/PwaVault";
import { GlobalVideoCall } from "@/modules/call/_components/GlobalVideoCall";
import { ActiveCallIndicator } from "@/modules/call/_components/ActiveCallIndicator";
import { ThemeColorUpdater } from "./theme-color-updater";
import { PwaSplash } from "./pwa-splash";
import { SWRConfig } from "swr";
import CookieConsent from "@/components/ui/cookie-consent";
import NextTopLoader from "nextjs-toploader";

interface ProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  themeMode: string;
  nonce?: string;
}

export function Providers({ children, locale, messages, themeMode, nonce }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={themeMode}
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <NextTopLoader
        color="hsl(var(--primary))"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px hsl(var(--primary)),0 0 5px hsl(var(--primary))"
      />
      <NextIntlClientProvider messages={messages} locale={locale} timeZone="America/Sao_Paulo">
        <SWRConfig
          value={{
            provider: () => new Map(),
            dedupingInterval: 60000, // 60 seconds to deduplicate parallel component requests
            revalidateOnFocus: false, // Disable aggressive automatic revalidation on tab/window focus
            revalidateOnReconnect: true, // Seamless revalidation when internet reconnects
          }}
        >
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </SWRConfig>
        <Toaster />
        <OfflineBanner />
        <PwaHandler />
        <ThemeColorUpdater />
        <PwaSplash />
        <NotificationPermissionVault />
        <PwaVault />
        <GlobalVideoCall />
        <ActiveCallIndicator />
        <CookieConsent />
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
