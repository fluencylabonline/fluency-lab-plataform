"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWA() {
    const [isStandalone, setIsStandalone] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(display-mode: standalone)");

        const checkStandalone = () => {
            const isStandaloneMode =
                mediaQuery.matches ||
                (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
            setIsStandalone(isStandaloneMode);
        };

        checkStandalone();
        mediaQuery.addEventListener("change", checkStandalone);

        return () => mediaQuery.removeEventListener("change", checkStandalone);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const install = useCallback(async () => {
        if (!deferredPrompt) return null;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        setDeferredPrompt(null);
        setIsInstallable(false);

        return outcome;
    }, [deferredPrompt]);

    return {
        isStandalone,
        isInstallable,
        install,
    };
}