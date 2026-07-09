"use client";

import { AlertTriangle, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PendingClass {
    id: string;
    startAt: Date;
    student?: { name: string | null } | null;
}

interface PendingClassesWarningProps {
    pendingClasses: PendingClass[];
}

export function PendingClassesWarning({ pendingClasses }: PendingClassesWarningProps) {
    if (!pendingClasses || pendingClasses.length === 0) return null;

    return (
        <div className="card border-l-4 border-l-amber-500 bg-amber-500/10 p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <h3 className="font-semibold text-lg text-amber-500">Atenção: Aulas Pendentes</h3>
            </div>
            
            <p className="text-sm text-muted-foreground leading-relaxed">
                Você tem <strong className="pr-1">{pendingClasses.length}</strong> aula(s) que já ocorreu(ram) mas ainda está(ão) com o status de &quot;Agendada&quot;.
                Você precisa atualizar o status dessas aulas, senão o seu pagamento pode ser comprometido.
            </p>
            
            <div className="space-y-2 mt-2">
                {pendingClasses.slice(0, 3).map(c => (
                    <div key={c.id} className="text-xs flex items-center justify-between p-2 bg-background rounded border">
                        <span className="font-medium">{c.student?.name || "Aluno Desconhecido"}</span>
                        <span className="text-muted-foreground">{format(new Date(c.startAt), "dd/MM 'às' HH:mm", { locale: ptBR })}</span>
                    </div>
                ))}
                {pendingClasses.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">+ {pendingClasses.length - 3} outra(s) aula(s)</p>
                )}
            </div>

            <Link href="/hub/teacher/schedule" className="w-full mt-2">
                <Button variant="outline" className="w-full border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-500">
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Ir para a Agenda
                </Button>
            </Link>
        </div>
    );
}
