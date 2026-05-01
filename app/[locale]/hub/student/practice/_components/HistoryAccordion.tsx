"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, History } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ArchivedPlan {
  id: string;
  name: string;
  status: string;
  updatedAt: Date;
  lessons: Array<{
    lessonId: string;
    isCompleted: boolean;
    completedAt: Date | null;
    lesson?: { title: string };
  }>;
}

interface HistoryAccordionProps {
  plans: ArchivedPlan[];
}

export function HistoryAccordion({ plans }: HistoryAccordionProps) {
  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-bold text-muted-foreground">Nenhum histórico ainda</h3>
        <p className="text-sm text-muted-foreground/60 max-w-[200px]">
          Seus planos concluídos aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <Accordion className="w-full space-y-4">
      {plans.map((plan) => (
        <AccordionItem 
          key={plan.id} 
          value={plan.id}
          className="border rounded-xl bg-card overflow-hidden"
        >
          <AccordionTrigger className="px-4 py-4 hover:no-underline">
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-bold">{plan.name}</span>
              <span className="text-xs text-muted-foreground">
                Concluído em {format(new Date(plan.updatedAt), "MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0 border-t">
            <div className="divide-y">
              {plan.lessons.map((lesson) => (
                <div 
                  key={lesson.lessonId} 
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{lesson.lesson?.title || "Lição"}</span>
                  </div>
                  {lesson.completedAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(lesson.completedAt), "dd/MM/yy")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
