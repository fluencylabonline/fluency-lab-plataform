"use client";
import { Brain, Zap, Target } from "lucide-react";
import { useTranslations } from "next-intl";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";

interface ProgressStatusCardProps {
  retentionRate: number;
  vocabularyLevel: number;
  totalClasses: number;
  completedClasses: number;
}

export function ProgressStatusCard({ retentionRate, vocabularyLevel, totalClasses, completedClasses }: ProgressStatusCardProps) {
  const t = useTranslations("Hub.StudentProfile.ProgressStatus");

  const classProgress = totalClasses > 0 ? (completedClasses / totalClasses) * 100 : 0;

  return (
    <div className="card p-6 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-bold text-foreground mb-8">
          {t("title") || "Métricas de Aprendizado"}
        </h3>

        <div className="space-y-10">
          {/* Retention */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-500">
                  <Brain className="w-4 h-4" />
                </div>
                {t("retention") || "Retenção de Conteúdo"}
              </div>
              <span className="text-sm font-black text-foreground tabular-nums">{retentionRate}%</span>
            </div>
            <Progress value={retentionRate} className="gap-0">
              <ProgressTrack className="h-2 bg-purple-500/10">
                <ProgressIndicator className="bg-purple-500" />
              </ProgressTrack>
            </Progress>
          </div>

          {/* Vocabulary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-500">
                  <Zap className="w-4 h-4" />
                </div>
                {t("vocabulary") || "Nível de Vocabulário"}
              </div>
              <span className="text-sm font-black text-foreground tabular-nums">{vocabularyLevel}/10</span>
            </div>
            <Progress value={vocabularyLevel * 10} className="gap-0">
              <ProgressTrack className="h-2 bg-yellow-500/10">
                <ProgressIndicator className="bg-yellow-500" />
              </ProgressTrack>
            </Progress>
          </div>

          {/* Curriculum */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-sm font-bold text-muted-foreground">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <Target className="w-4 h-4" />
                </div>
                {t("curriculum") || "Progresso no Ciclo"}
              </div>
              <span className="text-sm font-black text-foreground tabular-nums">{Math.round(classProgress)}%</span>
            </div>
            <Progress value={classProgress} className="gap-0">
              <ProgressTrack className="h-2 bg-blue-500/10">
                <ProgressIndicator className="bg-blue-500" />
              </ProgressTrack>
            </Progress>
          </div>
        </div>
      </div>

    </div>
  );
}
