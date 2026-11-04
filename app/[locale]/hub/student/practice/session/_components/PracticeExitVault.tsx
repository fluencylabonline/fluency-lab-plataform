"use client";

import { 
  Vault, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription, 
  VaultFooter, 
  VaultContent, 
  VaultIcon, 
  VaultPrimaryButton, 
  VaultSecondaryButton 
} from "@/components/ui/vault";
import { useTranslations } from "next-intl";

interface PracticeExitVaultProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function PracticeExitVault({
  isOpen,
  onOpenChange,
  onConfirm,
}: PracticeExitVaultProps) {
  const t = useTranslations("Practice.session");
  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent showHandle={false}>
        <VaultHeader showCloseButton={false}>
          <VaultIcon type="warning" />
          <VaultTitle>{t("exitTitle")}</VaultTitle>
          <VaultDescription>
            {t.rich("exitDescription", { strong: (chunks) => <strong>{chunks}</strong> })}
          </VaultDescription>
        </VaultHeader>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            {t("keepPracticing")}
          </VaultSecondaryButton>
          <VaultPrimaryButton 
            onClick={onConfirm}
            variant="destructive"
          >
            {t("exitNow")}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
