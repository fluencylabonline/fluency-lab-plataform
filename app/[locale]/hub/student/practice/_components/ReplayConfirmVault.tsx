"use client";

import { Vault, VaultHeader, VaultTitle, VaultDescription, VaultFooter, VaultContent, VaultBody, VaultIcon, VaultPrimaryButton, VaultSecondaryButton } from "@/components/ui/vault";
import { Coins } from "lucide-react";
import { purchaseReplaySessionAction } from "@/modules/learning/learning.actions";
import { useState } from "react";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("ReplayConfirmVault");
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
        notify.success(t("success", { dayIndex }));
        onOpenChange(false);
        router.push(`/hub/student/practice/session?planId=${planId}&day=${dayIndex}&replay=true`);
      } else {
        notify.error(t("error"));
      }
    } catch {
      notify.error(t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader showCloseButton={false}>
          <VaultIcon type="confirm" />
          <VaultTitle>{t("title")}</VaultTitle>
          <VaultDescription>
            {t.rich("description", { 
              dayIndex,
              strong: (chunks) => <strong>{chunks}</strong>
            })}
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-6">
          <div className="bg-muted/50 rounded-md p-4 border border-border/50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{t("yourBalance")}</span>
              <div className="flex items-center gap-1.5 font-bold">
                <Coins className="w-4 h-4 text-yellow-500" />
                {userXP} XP
              </div>
            </div>
            <div className="flex justify-between items-center text-primary">
              <span className="text-sm font-medium">{t("replayCost")}</span>
              <div className="flex items-center gap-1.5 font-bold">
                <Coins className="w-4 h-4 text-yellow-500" />
                {cost} XP
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm font-bold">{t("finalBalance")}</span>
              <div className={canAfford ? "text-foreground font-black" : "text-destructive font-black"}>
                {userXP - cost} XP
              </div>
            </div>
          </div>

          {!canAfford && (
            <p className="text-xs text-destructive text-center font-medium">
              {t("insufficientXP")}
            </p>
          )}
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t("cancel")}
          </VaultSecondaryButton>
          <VaultPrimaryButton 
            onClick={handleConfirm} 
            disabled={!canAfford || isLoading}
            className="gap-2"
          >
            {isLoading ? t("processing") : t("confirm")}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
