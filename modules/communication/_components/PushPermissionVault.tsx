"use client";

import { useState, useEffect } from "react";
import { 
    Vault, 
    VaultContent, 
    VaultHeader, 
    VaultTitle, 
    VaultDescription, 
    VaultFooter, 
    VaultPrimaryButton,
    VaultSecondaryButton,
    VaultIcon,
    VaultBody
} from "@/components/ui/vault";

interface PushPermissionVaultProps {
    onGranted: () => void;
}

export function PushPermissionVault({ onGranted }: PushPermissionVaultProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only run on client and check if browser supports notifications
        if (typeof window !== "undefined" && "Notification" in window) {
            // Only show if the user hasn't made a choice yet
            if (Notification.permission === "default") {
                // Show after a small delay (2 seconds) to avoid immediate interruption
                const timer = setTimeout(() => setIsOpen(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleRequest = async () => {
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === "granted") {
                setIsOpen(false);
                onGranted();
            } else {
                // If denied or dismissed, just close
                setIsOpen(false);
            }
        } catch (error) {
            console.error("[PushPermissionVault] Error requesting permission:", error);
            setIsOpen(false);
        }
    };

    return (
        <Vault open={isOpen} onOpenChange={setIsOpen}>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="notification" />
                    <VaultTitle>Fique por dentro!</VaultTitle>
                    <VaultDescription>
                        Gostaria de receber notificações sobre suas aulas, mensagens e atualizações importantes em tempo real?
                    </VaultDescription>
                </VaultHeader>
                
                <VaultBody className="text-center text-sm text-muted-foreground pb-4">
                    As notificações push permitem que você saiba o que está acontecendo na FluencyLab, mesmo quando não estiver com o site aberto.
                </VaultBody>
                
                <VaultFooter>
                    <VaultSecondaryButton onClick={() => setIsOpen(false)}>
                        Agora não
                    </VaultSecondaryButton>
                    <VaultPrimaryButton onClick={handleRequest}>
                        Ativar Notificações
                    </VaultPrimaryButton>
                </VaultFooter>
            </VaultContent>
        </Vault>
    );
}
