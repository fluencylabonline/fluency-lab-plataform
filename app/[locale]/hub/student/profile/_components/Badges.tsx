"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { BADGES_CONFIG } from "@/lib/badges-config";
import { AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";
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

interface StudentProficiency {
  language: string;
  code: string;
}

interface BadgesProps {
  proficiencies: StudentProficiency[];
}

export function Badges({ proficiencies }: BadgesProps) {
  const t = useTranslations("Hub.StudentProfile.Badges");

  if (proficiencies.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center text-center border-dashed">
        <div className="w-12 h-12 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-stone-400" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-1">
          {t("empty_title")}
        </h3>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4 max-w-[200px]">
          {t("empty_description")}
        </p>
        <Link
          href="/hub/student/placement"
          className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
        >
          {t("empty_cta")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {proficiencies.map((p) => {
        const config = BADGES_CONFIG[p.language] || BADGES_CONFIG.en;
        const levelsInfo = config.levelsInfo(t);
        const currentLevel = levelsInfo.find((l) => l.code === p.code) || levelsInfo[0];
        const badgeImage = config.badgeMapping[p.code] || config.badgeMapping["A1"];

        const vaultDescription = p.language === "en" 
          ? t("vault_desc_en")
          : p.language === "pt"
            ? t("vault_desc_pt")
            : t("vault_desc_generic", { language: p.language });

        return (
          <div key={p.language} className="card p-6 flex flex-col items-center justify-center text-center h-full">
            <Vault>
              <VaultTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group cursor-pointer focus:outline-none flex flex-col items-center"
                >
                  <Image
                    src={`/images/badges/${badgeImage}`}
                    alt={`Level ${p.code}`}
                    width={140}
                    height={140}
                    className="relative z-10 drop-shadow-2xl"
                  />
                  <div className="mt-4 relative z-10">
                    <h3 className="text-3xl font-black text-foreground tracking-tighter">{p.code}</h3>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">
                      {currentLevel.character}
                    </p>
                  </div>
                </motion.button>
              </VaultTrigger>

              <VaultContent>
                <VaultHeader>
                  <VaultIcon src={`/images/badges/${badgeImage}`} alt={p.code} />
                  <VaultTitle>{t("vault_title")}</VaultTitle>
                  <VaultDescription>
                    {vaultDescription}
                  </VaultDescription>
                </VaultHeader>
                <VaultBody className="mt-6">
                  <div className="space-y-4">
                    {levelsInfo.map((level) => (
                      <div
                        key={level.code}
                        className={`p-4 rounded-md border transition-all ${level.code === p.code
                          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                          : "bg-muted/30 border-border/50 opacity-60"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{level.emoji}</span>
                            <div className="text-left">
                              <span className={`block text-lg font-black leading-none ${level.code === p.code ? "text-primary" : "text-foreground"}`}>
                                {level.code} - {level.character}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                {level.show}
                              </span>
                            </div>
                          </div>
                          {level.code === p.code && (
                            <span className="px-2 py-0.5 rounded-full bg-primary text-[10px] font-bold text-white uppercase tracking-tighter">
                              {t("current")}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed italic mb-3">
                          &quot;{level.quote}&quot;
                        </p>

                        <p className="text-[12px] font-medium text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/50 p-2 rounded border border-dashed border-stone-200 dark:border-stone-800">
                          {level.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </VaultBody>
              </VaultContent>
            </Vault>
          </div>
        );
      })}
    </div>
  );
}
