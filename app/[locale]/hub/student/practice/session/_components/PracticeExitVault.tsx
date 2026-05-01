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
  return (
    <Vault open={isOpen} onOpenChange={onOpenChange}>
      <VaultContent showHandle={false}>
        <VaultHeader showCloseButton={false}>
          <VaultIcon type="warning" />
          <VaultTitle>Deseja mesmo sair?</VaultTitle>
          <VaultDescription>
            Seu progresso nesta lição será salvo para que você continue depois, mas você **não ganhará XP** até concluí-la totalmente.
          </VaultDescription>
        </VaultHeader>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            Continuar Praticando
          </VaultSecondaryButton>
          <VaultPrimaryButton 
            onClick={onConfirm}
            variant="destructive"
          >
            Sair Agora
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
