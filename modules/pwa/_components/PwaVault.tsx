"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { useDevice } from "@/hooks/ui/use-device";

export function PwaVault() {
  const t = useTranslations("PwaVault");
  const pathname = usePathname();
  const { isStandalone, isInstallable, updateAvailable, install, update } = useDevice();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"install" | "update" | null>(null);

  useEffect(() => {
    const checkState = () => {
      const now = Date.now();

      // 1. Check for Update (ONLY for PWA)
      if (updateAvailable && isStandalone) {
        const lastDismiss = localStorage.getItem("pwa_update_dismissed_at");
        const lastDismissVal = lastDismiss ? parseInt(lastDismiss, 10) : 0;
        const oneWeek = 7 * 24 * 60 * 60 * 1000;

        if (isNaN(lastDismissVal) || now - lastDismissVal > oneWeek) {
          setType("update");
          setIsOpen(true);
          return;
        }
      }

      // 2. Check for Install (Only on Profile Page and NOT standalone)
      const isProfilePage = pathname?.includes("/profile");
      if (isInstallable && !isStandalone && isProfilePage) {
        const lastDismiss = localStorage.getItem("pwa_install_dismissed_at");
        const lastDismissVal = lastDismiss ? parseInt(lastDismiss, 10) : 0;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        if (isNaN(lastDismissVal) || now - lastDismissVal > thirtyDays) {
          setType("install");
          setIsOpen(true);
          return;
        }
      }

      // Otherwise close
      setIsOpen(false);
      setType(null);
    };

    const timer = setTimeout(checkState, 500); // Small delay to allow hydration
    return () => clearTimeout(timer);
  }, [isInstallable, updateAvailable, isStandalone, pathname]);

  const handleAction = async () => {
    if (type === "install") {
      await install();
    } else if (type === "update") {
      localStorage.setItem("pwa_update_dismissed_at", Date.now().toString());
      update();
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    if (type === "install") {
      localStorage.setItem("pwa_install_dismissed_at", Date.now().toString());
    } else if (type === "update") {
      localStorage.setItem("pwa_update_dismissed_at", Date.now().toString());
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleDismiss();
    } else {
      setIsOpen(true);
    }
  };

  if (!type) return null;

  return (
    <Vault open={isOpen} onOpenChange={handleOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type={type === "install" ? "download" : "success"} />
          <VaultTitle>
            {type === "install" ? t("installTitle") : t("updateTitle")}
          </VaultTitle>
          <VaultDescription>
            {type === "install" ? t("installDescription") : t("updateDescription")}
          </VaultDescription>
        </VaultHeader>
        <VaultFooter>
          <VaultSecondaryButton onClick={handleDismiss}>
            {t("notNowButton")}
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={handleAction}>
            {type === "install" ? t("installButton") : t("updateButton")}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}

