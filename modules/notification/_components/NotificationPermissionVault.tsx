"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { useNotificationPermission } from "@/hooks/notification/use-notification-permission";
import { useNotificationStore } from "@/hooks/notification/use-notification-store";
import { saveSubscriptionAction } from "@/modules/notification/notification.actions";
import { env } from "@/env";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationPermissionVault() {
  const t = useTranslations("NotificationPermission");
  const { permission, requestPermission } = useNotificationPermission();
  const { isDismissed, dismiss } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Show vault only if permission is default and not dismissed in this session
    const shouldBeOpen = permission === "default" && !isDismissed;
    if (isOpen !== shouldBeOpen) {
      const timer = setTimeout(() => setIsOpen(shouldBeOpen), 0);
      return () => clearTimeout(timer);
    }
  }, [permission, isDismissed, isOpen]);

  const handleAllow = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      // Register logic (extracted from PwaHandler)
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });

        await saveSubscriptionAction({ subscription: subscription.toJSON() });
      }
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setIsOpen(false);
  };

  return (
    <Vault open={isOpen} onOpenChange={setIsOpen}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="notification" />
          <VaultTitle>{t("title")}</VaultTitle>
          <VaultDescription>
            {t("description")}
          </VaultDescription>
        </VaultHeader>
        <VaultFooter>
          <VaultSecondaryButton onClick={handleDismiss}>
            {t("notNowButton")}
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={handleAllow}>
            {t("allowButton")}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
