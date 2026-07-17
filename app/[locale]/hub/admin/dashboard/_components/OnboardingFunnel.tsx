"use client";

import { useState } from "react";
import { OnboardingStepStats } from "@/modules/dashboard/dashboard.types";
import { Users } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import Image from "next/image";

interface OnboardingFunnelProps {
  data: OnboardingStepStats[];
}

export function OnboardingFunnel({ data }: OnboardingFunnelProps) {
  const t = useTranslations("Dashboard.onboarding");
  const [open, setOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<OnboardingStepStats | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const firstCount = data[0]?.count ?? 1;

  const handleStepClick = (step: OnboardingStepStats) => {
    setSelectedStep(step);
    setOpen(true);
  };

  return (
    <>
      <div className="card h-full">
        <div className="px-6 pt-6 pb-3">
          <h3 className="subtitle">{t("title")}</h3>
          <div className="paragraph">{t("subtitle")}</div>
        </div>
        <div className="px-6 pb-6">
          {data.length > 0 ? (
            <div className="space-y-4">
              {data.map((step, idx) => {
                const pct = Math.round((step.count / maxCount) * 100);
                const conversionFromFirst =
                  idx > 0 && firstCount > 0
                    ? Math.round((step.count / firstCount) * 100)
                    : null;

                return (
                  <div key={step.step} className="space-y-1.5">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleStepClick(step)}
                      onKeyDown={(e) => e.key === "Enter" && handleStepClick(step)}
                      className="space-y-1.5 cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-all duration-200 outline-none"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Step number pill */}
                          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium truncate">{step.label}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {conversionFromFirst !== null && (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {conversionFromFirst}%
                            </span>
                          )}
                          <span className="text-sm font-semibold tabular-nums">
                            {step.count}
                            <span className="text-xs text-muted-foreground font-normal ml-0.5">{t("students")}</span>
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pct}%`,
                            background: "var(--primary)",
                            opacity: 1 - idx * 0.12,
                          }}
                        />
                      </div>
                    </div>

                    {/* Drop-off indicator between steps */}
                    {idx < data.length - 1 && data[idx + 1] && (
                      <div className="flex items-center gap-1 pl-7">
                        <div className="h-px flex-1 bg-border/50" />
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                          {data[idx + 1].count < step.count
                            ? t("dropped", { count: step.count - data[idx + 1].count })
                            : ""}
                        </span>
                        <div className="h-px flex-1 bg-border/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[180px] gap-2 text-muted-foreground">
              <Users className="h-8 w-8 opacity-30" />
              <span className="text-sm">{t("empty")}</span>
            </div>
          )}
        </div>
      </div>

      <Vault open={open} onOpenChange={setOpen}>
        <VaultContent aria-label={`Alunos no passo: ${selectedStep?.label || ""}`} className="sm:max-w-md">
          <VaultHeader>
            <VaultTitle>{selectedStep?.label}</VaultTitle>
            <VaultDescription>
              {selectedStep?.count} {selectedStep?.count === 1 ? "aluno está" : "alunos estão"} nesta etapa do onboarding.
            </VaultDescription>
          </VaultHeader>

          <VaultBody>
            <div className="flex flex-col divide-y divide-border/50 max-h-[50vh] overflow-y-auto pr-1">
              {!selectedStep?.students || selectedStep.students.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Nenhum aluno nesta etapa.
                </p>
              ) : (
                selectedStep.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center gap-3 py-3"
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                      {student.photoUrl ? (
                        <Image
                          src={student.photoUrl}
                          alt={student.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>
    </>
  );
}