"use client";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultIcon
} from "@/components/ui/vault";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

interface WordOfTheDayVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WordOfTheDayVault({ open, onOpenChange }: WordOfTheDayVaultProps) {
  const t = useTranslations("WordOfTheDay");
  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="success" />
          <VaultTitle>{t("title")}</VaultTitle>
          <VaultDescription>
            {t("description")}
          </VaultDescription>
        </VaultHeader>
        <VaultBody className="flex flex-col items-center justify-center py-6 space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center animate-pulse">
            <Sparkles className="w-10 h-10 text-amber-500" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-3xl font-black italic tracking-tight">Resilience</h3>
            <p className="text-muted-foreground italic font-serif">/rɪˈzɪl.jəns/</p>
            <div className="bg-primary/5 border border-primary/10 px-4 py-2 rounded-xl mt-4 inline-block">
              <p className="text-sm font-medium">A capacidade de se recuperar rapidamente de dificuldades.</p>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-4 pt-6 border-t border-dashed">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">{t("usageExample")}</p>
            <p className="text-sm text-center italic text-balance leading-relaxed">
              &quot;The survivors showed remarkable <span className="font-bold text-primary">resilience</span> in the face of disaster.&quot;
            </p>
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-muted-foreground italic">{t("experimentalFeature")}</p>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
