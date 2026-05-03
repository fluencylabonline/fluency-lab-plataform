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
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

interface LearnedItemsVaultProps {
  items: LearningItemDetail[];
  trigger: React.ReactNode;
}

export function LearnedItemsVault({ items, trigger }: LearnedItemsVaultProps) {
  const t = useTranslations("LearnedItemsVault");
  const params = useParams();
  const locale = params.locale as string;
  const dateLocale = locale === "pt" ? ptBR : enUS;

  return (
    <Vault>
      <VaultTrigger asChild>{trigger}</VaultTrigger>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="success" />
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
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {item.type === "structure" ? t("typeStructure") : t("typeVocabulary")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">{t("learnedAt")}</p>
                    <p className="text-[10px] font-bold">
                      {item.learnedAt ? format(new Date(item.learnedAt), "dd MMM, yyyy", { locale: dateLocale }) : "--"}
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
