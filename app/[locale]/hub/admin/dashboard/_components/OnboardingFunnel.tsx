"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OnboardingStepStats } from "@/modules/dashboard/dashboard.types";

interface OnboardingFunnelProps {
  data: OnboardingStepStats[];
}

export function OnboardingFunnel({ data }: OnboardingFunnelProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <Card className="card border-none shadow-none h-full">
      <CardHeader>
        <CardTitle>Funil de Onboarding</CardTitle>
        <CardDescription>Estudantes por etapa do processo inicial</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length > 0 ? (
            data.map((step) => (
              <div key={step.step} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>{step.label}</span>
                  <span>{step.count} alunos</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${(step.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8">
              Sem dados de onboarding
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
