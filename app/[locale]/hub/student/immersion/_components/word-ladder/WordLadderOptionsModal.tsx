"use client";

import { Button } from "@/components/ui/button";
import { Vault, VaultContent, VaultHeader, VaultTitle } from "@/components/ui/vault";
import { Lightbulb, Eye, GraduationCap, BarChart } from "lucide-react";
import { Difficulty } from "@/modules/immersion/immersion.types";
import { useTranslations } from "next-intl";

interface WordLadderOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learningMode: boolean;
  setLearningMode: (mode: boolean | ((p: boolean) => boolean)) => void;
  difficulty: Difficulty;
  setDifficulty: (diff: Difficulty) => void;
  onHint: () => void;
  onReveal: () => void;
  canHint: boolean;
  canReveal: boolean;
}

export function WordLadderOptionsModal({
  open,
  onOpenChange,
  learningMode,
  setLearningMode,
  difficulty,
  setDifficulty,
  onHint,
  onReveal,
  canHint,
  canReveal
}: WordLadderOptionsModalProps) {
  const t = useTranslations("Immersion.wordLadder");
  const difficulties: { label: string; value: Difficulty; color: string }[] = [
    { label: t("easy"), value: "easy", color: "text-green-500" },
    { label: t("medium"), value: "medium", color: "text-yellow-500" },
    { label: t("hard"), value: "hard", color: "text-red-500" },
  ];

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="p-6">
        <VaultHeader>
          <VaultTitle>{t("settings")}</VaultTitle>
        </VaultHeader>
        
        <div className="flex flex-col gap-4 mt-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-muted-foreground ml-1 flex items-center gap-2">
              <BarChart className="w-4 h-4" /> {t("difficultyNext")}
            </span>
            <div className="flex bg-muted/50 p-1 rounded-2xl gap-1">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`flex-1 h-10 rounded-md text-xs font-bold transition-all ${
                    difficulty === d.value 
                      ? "bg-background shadow-sm " + d.color
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-border my-2" />

          <Button
            variant={learningMode ? "default" : "outline"}
            className="w-full h-14 justify-start gap-3 rounded-2xl shadow-none"
            onClick={() => setLearningMode((p: boolean) => !p)}
          >
            <GraduationCap className="w-5 h-5" />
            <div className="flex flex-col items-start">
              <span className="font-bold">Modo Aprendizagem</span>
              <span className="text-xs opacity-70">{learningMode ? "Ativado" : "Desativado"}</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3 rounded-2xl shadow-none"
            onClick={() => {
              onHint();
              onOpenChange(false);
            }}
            disabled={!canHint}
          >
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <div className="flex flex-col items-start">
              <span className="font-bold">{t("hint")}</span>
              <span className="text-xs opacity-70">{t("hintDesc")}</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full h-14 justify-start gap-3 rounded-2xl shadow-none"
            onClick={() => {
              onReveal();
              onOpenChange(false);
            }}
            disabled={!canReveal}
          >
            <Eye className="w-5 h-5 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="font-bold">{t("solution")}</span>
              <span className="text-xs opacity-70">{t("solutionDesc")}</span>
            </div>
          </Button>
        </div>
      </VaultContent>
    </Vault>
  );
}
