"use client";

import React, { useEffect, useState } from "react";
import {
    CircleCheckIcon,
    InfoIcon,
    Loader2Icon,
    OctagonXIcon,
    TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps, toast as sonnerToast } from "sonner";
import { usePWA } from "@/hooks/ui/usePWA";
import { useIsMobile } from "@/hooks/ui/useMobile";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultIcon,
} from "@/components/ui/vault";

type NotificationType = "success" | "error" | "info" | "warning" | "loading";

interface NotificationData {
    type: NotificationType;
    title: string;
    description?: string;
}

const notificationEmitter = new EventTarget();

export const notify = {
    success: (title: string, description?: string) =>
        notificationEmitter.dispatchEvent(
            new CustomEvent<NotificationData>("notify", {
                detail: { type: "success", title, description },
            })
        ),
    error: (title: string, description?: string) =>
        notificationEmitter.dispatchEvent(
            new CustomEvent<NotificationData>("notify", {
                detail: { type: "error", title, description },
            })
        ),
    info: (title: string, description?: string) =>
        notificationEmitter.dispatchEvent(
            new CustomEvent<NotificationData>("notify", {
                detail: { type: "info", title, description },
            })
        ),
    warning: (title: string, description?: string) =>
        notificationEmitter.dispatchEvent(
            new CustomEvent<NotificationData>("notify", {
                detail: { type: "warning", title, description },
            })
        ),
    // Expõe o Sonner nativo caso precise forçar um toast comum mesmo no PWA
    sonner: sonnerToast,
};

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme } = useTheme();
    const { isStandalone } = usePWA();
    const isMobile = useIsMobile();

    const [vaultData, setVaultData] = useState<NotificationData | null>(null);
    const [isVaultOpen, setIsVaultOpen] = useState(false);

    useEffect(() => {
        const handleNotify = (e: Event) => {
            const { type, title, description } = (e as CustomEvent<NotificationData>).detail;

            if (isStandalone && type !== "loading") {
                setVaultData({ type, title, description });
                setIsVaultOpen(true);
            } else {
                switch (type) {
                    case "success":
                        sonnerToast.success(title, { description });
                        break;
                    case "error":
                        sonnerToast.error(title, { description });
                        break;
                    case "warning":
                        sonnerToast.warning(title, { description });
                        break;
                    case "info":
                    default:
                        sonnerToast.info(title, { description });
                        break;
                }
            }
        };

        notificationEmitter.addEventListener("notify", handleNotify);
        return () => notificationEmitter.removeEventListener("notify", handleNotify);
    }, [isStandalone]);

    const sonnerPosition = isMobile ? "bottom-center" : "top-right";

    return (
        <>
            <Sonner
                theme={theme as ToasterProps["theme"]}
                className="toaster group"
                position={sonnerPosition}
                icons={{
                    success: <CircleCheckIcon className="size-4" />,
                    info: <InfoIcon className="size-4" />,
                    warning: <TriangleAlertIcon className="size-4" />,
                    error: <OctagonXIcon className="size-4" />,
                    loading: <Loader2Icon className="size-4 animate-spin" />,
                }}
                toastOptions={{
                    style: {
                        background: "var(--primary)",
                        color: "white",
                        border: "1px solid var(--primary)",
                        borderRadius: "var(--radius)",
                    },
                    classNames: {
                        description: "!text-white",
                    },
                }}
                {...props}
            />

            <Vault open={isVaultOpen} onOpenChange={setIsVaultOpen}>
                <VaultContent>
                    <VaultHeader showCloseButton={false}>
                        {vaultData && (
                            <>
                                <VaultIcon type={vaultData.type as "success" | "error" | "info" | "warning"} />
                                <VaultTitle>{vaultData.title}</VaultTitle>
                                {vaultData.description && (
                                    <VaultDescription>{vaultData.description}</VaultDescription>
                                )}
                            </>
                        )}
                    </VaultHeader>
                </VaultContent>
            </Vault>
        </>
    );
};

export { Toaster };