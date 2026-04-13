"use client";

import { usePwaStore } from "./use-pwa-store";

export function usePWA() {
    const { isStandalone, deferredPrompt, install: storeInstall } = usePwaStore();

    const install = async () => {
        const outcome = await storeInstall();
        return outcome;
    };

    return {
        isStandalone,
        isInstallable: !!deferredPrompt,
        install,
    };
}