"use client";

import { Vault, VaultHeader, VaultTitle, VaultDescription, VaultFooter, VaultContent, VaultBody, VaultIcon, VaultPrimaryButton, VaultSecondaryButton } from "@/components/ui/vault";
import { Coins } from "lucide-react";
import { purchaseReplaySessionAction } from "@/modules/learning/learning.actions";
import { useState } from "react";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";

interface ReplayConfirmVaultProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  dayIndex: number;
  currentDay: number;
  userXP: number;
}

export function ReplayConfirmVault({
  isOpen,
  onOpenChange,
  planId,
  dayIndex,
  currentDay,
  userXP,
}: ReplayConfirmVaultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const daysDiff = Math.max(0, currentDay - dayIndex);
  const cost = 50 + daysDiff * 10;
  const canAfford = userXP >= cost;

  const handleConfirm = async () => {
    if (!canAfford) return;
    setIsLoading(true);
    
    try {
      const result = await purchaseReplaySessionAction({
        planId,
        targetDay: dayIndex,
        currentDay,
      });

      if (result?.data?.success) {
        notify.success(`Prática do Dia ${dayIndex} desbloqueada!`);
        onOpenChange(false);
        router.push(`/hub/student/practice/session?planId=${planId}&day=${dayIndex}&replay=true`);
      } else {
        notify.error("Erro ao processar XP. Tente novamente.");
      }
    } catch {
      notify.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader showCloseButton={false}>
          <VaultIcon type="confirm" />
          <VaultTitle>Replay de Prática</VaultTitle>
          <VaultDescription>
            Você deseja refazer a prática adaptativa do <strong>Dia {dayIndex}</strong>?
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-6">
          <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Seu Saldo</span>
              <div className="flex items-center gap-1.5 font-bold">
                <Coins className="w-4 h-4 text-yellow-500" />
                {userXP} XP
              </div>
            </div>
            <div className="flex justify-between items-center text-primary">
              <span className="text-sm font-medium">Custo do Replay</span>
              <div className="flex items-center gap-1.5 font-bold">
                <Coins className="w-4 h-4 text-yellow-500" />
                {cost} XP
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm font-bold">Saldo Final</span>
              <div className={canAfford ? "text-foreground font-black" : "text-destructive font-black"}>
                {userXP - cost} XP
              </div>
            </div>
          </div>

          {!canAfford && (
            <p className="text-xs text-destructive text-center font-medium">
              Você não possui XP suficiente para este replay. Pratique hoje para ganhar mais!
            </p>
          )}
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </VaultSecondaryButton>
          <VaultPrimaryButton 
            onClick={handleConfirm} 
            disabled={!canAfford || isLoading}
            className="gap-2"
          >
            {isLoading ? "Processando..." : "Confirmar Replay"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
