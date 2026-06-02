"use client";

import { useTranslations } from "next-intl";
import { useDevice } from "@/hooks/ui/use-device";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Smartphone, CheckCircle2 } from "lucide-react";

export function AppSettings() {
  const t = useTranslations("Settings");
  const pwaT = useTranslations("PwaVault");
  const { isInstallable, updateAvailable, install, update, isStandalone } = useDevice();

  const showInstall = isInstallable && !isStandalone;
  const hasAction = showInstall || updateAvailable;

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-1">
          <Smartphone className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">{t("app")}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{t("appDescription")}</p>

        <div className="space-y-4">
          {updateAvailable && (
            <div className="item flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-primary/10 rounded-full">
                  <RefreshCw className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{pwaT("updateTitle")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {pwaT("updateDescription")}
                  </p>
                </div>
              </div>
              <Button onClick={update} className="w-full md:w-auto">
                <RefreshCw className="w-4 h-4 mr-2" />
                {pwaT("updateButton")}
              </Button>
            </div>
          )}

          {showInstall && (
            <div className="item flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className="mt-1 p-2 bg-primary/10 rounded-full">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold">{pwaT("installTitle")}</h4>
                  <p className="text-sm text-muted-foreground">
                    {pwaT("installDescription")}
                  </p>
                </div>
              </div>
              <Button onClick={install} variant="secondary" className="w-full md:w-auto">
                <Download className="w-4 h-4 mr-2" />
                {pwaT("installButton")}
              </Button>
            </div>
          )}

          {!hasAction && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-4 bg-green-500/10 rounded-full mb-4">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h4 className="font-semibold text-lg">{pwaT("appReadyTitle")}</h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                {pwaT("appReadyDescription")}
              </p>
              {isStandalone && (
                <p className="mt-4 text-xs font-medium px-2 py-1 bg-muted rounded border uppercase tracking-wider">
                  {pwaT("activeAppMode")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
