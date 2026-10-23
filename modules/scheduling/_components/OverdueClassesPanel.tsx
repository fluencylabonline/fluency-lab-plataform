"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertOctagon, Ban, CheckCircle2, Loader2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import { resolveOverdueClassAction } from "@/modules/scheduling/scheduling.actions";

type ResolvedStatus = "completed" | "no-show" | "canceled-teacher";

const STATUS_OPTIONS = [
  { value: "completed", label: "Aula dada", icon: CheckCircle2, color: "text-emerald-500" },
  { value: "no-show", label: "Aluno faltou", icon: UserX, color: "text-amber-500" },
  { value: "canceled-teacher", label: "Cancelada por mim", icon: Ban, color: "text-red-500" },
] as const;

export interface OverdueClassItem {
  id: string;
  startAt: string;
  studentName: string;
}

interface OverdueClassesPanelProps {
  classes: OverdueClassItem[];
  blockThreshold: number;
  /** Na tela de bloqueio, mostra o caminho de volta ao hub quando destravar. */
  showBackToHub?: boolean;
}

export function OverdueClassesPanel({ classes, blockThreshold, showBackToHub }: OverdueClassesPanelProps) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<OverdueClassItem | null>(null);

  const total = classes.length;
  const isBlocked = total >= blockThreshold;
  const progress = Math.min((total / blockThreshold) * 100, 100);

  const save = async (c: OverdueClassItem, status: ResolvedStatus) => {
    setSavingId(c.id);
    const result = await resolveOverdueClassAction({ classId: c.id, status });
    setSavingId(null);
    setConfirmCancel(null);
    if (result?.data?.success) {
      notify.success("Status da aula atualizado.");
      router.refresh();
    } else {
      notify.error(result?.data?.error || "Não foi possível atualizar a aula.");
    }
  };

  const handleSelect = (c: OverdueClassItem, status: ResolvedStatus) => {
    if (status === "canceled-teacher") {
      setConfirmCancel(c);
      return;
    }
    void save(c, status);
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-full bg-red-500/15 ring-8 ring-red-500/5">
          <AlertOctagon className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Aulas sem status informado</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          {isBlocked
            ? "O acesso à plataforma está travado. Informe o que aconteceu em cada aula para voltar a usar o sistema."
            : `Informe o que aconteceu em cada aula. Com ${blockThreshold} aulas atrasadas o sistema trava até você informar todas.`}{" "}
          Aulas sem status não entram no seu pagamento.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Aulas atrasadas</span>
          <span className={cn("font-semibold tabular-nums", isBlocked ? "text-red-500" : "text-amber-500")}>
            {total} de {blockThreshold}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", isBlocked ? "bg-red-500" : "bg-amber-500")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {classes.map((c) => {
          const start = new Date(c.startAt);
          const isSaving = savingId === c.id;
          return (
            <div
              key={c.id}
              className={cn(
                "card p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 transition-opacity",
                isSaving && "opacity-60"
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-muted shrink-0 leading-none">
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {format(start, "MMM", { locale: ptBR })}
                  </span>
                  <span className="text-lg font-semibold">{format(start, "dd")}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{c.studentName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {format(start, "EEEE 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:w-56">
                <Select
                  value=""
                  disabled={savingId !== null}
                  onValueChange={(v) => handleSelect(c, v as ResolvedStatus)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="O que aconteceu?" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="flex items-center gap-2">
                          <o.icon className={cn("w-4 h-4", o.color)} />
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSaving && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />}
              </div>
            </div>
          );
        })}
      </div>

      {showBackToHub && !isBlocked && (
        <Link href="/hub" className="self-center">
          <Button variant="outline">Voltar ao hub</Button>
        </Link>
      )}

      <Vault open={!!confirmCancel} onClose={() => setConfirmCancel(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="warning" />
            <div className="flex flex-col">
              <VaultTitle>Cancelar esta aula?</VaultTitle>
              <VaultDescription>
                A aula de <strong>{confirmCancel?.studentName}</strong> será marcada como cancelada por você.
                Ela não será paga e o aluno receberá 1 crédito de reposição e uma notificação.
              </VaultDescription>
            </div>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setConfirmCancel(null)} disabled={savingId !== null}>
              Voltar
            </VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={() => confirmCancel && save(confirmCancel, "canceled-teacher")}
              disabled={savingId !== null}
            >
              {savingId ? "Processando..." : "Sim, cancelar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
