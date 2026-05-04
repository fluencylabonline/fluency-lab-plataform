"use client";

import { 
  Vault, 
  VaultTrigger, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription,
  VaultBody,
  VaultIcon
} from "@/components/ui/vault";
import { LearningItemDetail } from "@/modules/learning/learning.types";
import { Clock } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";

interface ReviewedItemsVaultProps {
  items: LearningItemDetail[];
  trigger: React.ReactNode;
}

export function ReviewedItemsVault({ items, trigger }: ReviewedItemsVaultProps) {
  const t = useTranslations("ReviewedItemsVault");
  const formatIntl = useFormatter();

  return (
    <Vault>
      <VaultTrigger asChild>{trigger}</VaultTrigger>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="calendar" />
          <VaultTitle>{t("title")}</VaultTitle>
          <VaultDescription>
            {t("description")}
          </VaultDescription>
        </VaultHeader>
        <VaultBody className="max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="text-center py-10 opacity-50">{t("noItems")}</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="item p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500/10 p-2 rounded-lg">
                      <Clock className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {item.type === "structure" ? t("typeStructure") : t("typeVocabulary")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{t("reviewedAt")}</p>
                    <p className="text-[10px] font-bold">
                      {item.reviewedAt ? formatIntl.dateTime(new Date(item.reviewedAt), { hour: '2-digit', minute: '2-digit' }) : "--"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
