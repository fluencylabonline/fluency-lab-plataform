"use client";

import { AlertOctagon, ListChecks } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface OverdueClass {
    id: string;
    startAt: Date;
    student?: { name: string | null } | null;
}

interface OverdueClassesWarningProps {
    overdueClasses: OverdueClass[];
    blockThreshold: number;
}

export function OverdueClassesWarning({ overdueClasses, blockThreshold }: OverdueClassesWarningProps) {
    if (!overdueClasses || overdueClasses.length === 0) return null;

    const remaining = Math.max(blockThreshold - overdueClasses.length, 0);

    return (
        <div className="card border-l-4 border-l-red-500 bg-red-500/10 p-6 flex flex-col gap-4 max-w-xl">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-full">
                    <AlertOctagon className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg text-red-500">Aulas sem status informado</h3>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
                Você tem <strong className="pr-1">{overdueClasses.length}</strong> aula(s) atrasada(s) sem status.
                Aulas sem status não entram no seu pagamento.
                Com <strong>{blockThreshold}</strong> aulas atrasadas o sistema trava{" "}
                {remaining > 0
                    ? <>(faltam {remaining}) </>
                    : null}
                até você informar todas elas.
            </p>

            <div className="space-y-2">
                {overdueClasses.slice(0, 5).map(c => (
                    <div key={c.id} className="text-xs flex items-center justify-between p-2 bg-background rounded border">
                        <span className="font-medium">{c.student?.name || "Aluno Desconhecido"}</span>
                        <span className="text-muted-foreground">{format(new Date(c.startAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                ))}
                {overdueClasses.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+ {overdueClasses.length - 5} outra(s) aula(s)</p>
                )}
            </div>

            <Link href="/overdue-classes" className="w-full">
                <Button className="w-full">
                    <ListChecks className="w-4 h-4 mr-2" />
                    Informar status das aulas
                </Button>
            </Link>
        </div>
    );
}
