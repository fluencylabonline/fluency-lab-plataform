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
      // 1. Check for Update (Global Priority)
      if (updateAvailable) {
        setType("update");
        setIsOpen(true);
        return;
      }

      // 2. Check for Install (Only on Profile Page and NOT standalone)
      const isProfilePage = pathname?.includes("/profile");
      if (isInstallable && isProfilePage && !isStandalone) {
        setType("install");
        setIsOpen(true);
        return;
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
      update();
    }
    setIsOpen(false);
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!type) return null;

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
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
