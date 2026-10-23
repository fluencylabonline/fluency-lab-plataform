"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertOctagon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
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

const STATUS_OPTIONS: { value: ResolvedStatus; label: string }[] = [
  { value: "completed", label: "Aula dada" },
  { value: "no-show", label: "Aluno faltou (no-show)" },
  { value: "canceled-teacher", label: "Cancelada por mim" },
];

interface OverdueClass {
  id: string;
  startAt: string;
  studentName: string;
}

interface OverdueClassesContentProps {
  classes: OverdueClass[];
  blockThreshold: number;
}

export function OverdueClassesContent({ classes, blockThreshold }: OverdueClassesContentProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, ResolvedStatus>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<OverdueClass | null>(null);

  const isBlocked = classes.length >= blockThreshold;

  const save = async (c: OverdueClass, status: ResolvedStatus) => {
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

  const handleSave = (c: OverdueClass) => {
    const status = selected[c.id];
    if (!status) return;
    if (status === "canceled-teacher") {
      setConfirmCancel(c);
      return;
    }
    void save(c, status);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-500/20 rounded-full shrink-0">
          <AlertOctagon className="w-6 h-6 text-red-500" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Aulas sem status informado</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isBlocked
              ? `Você tem ${classes.length} aulas atrasadas e o acesso à plataforma está travado. Informe o que aconteceu em cada aula para voltar a usar o sistema.`
              : `Faltam ${classes.length} aula(s) para você informar. O sistema trava com ${blockThreshold} aulas atrasadas.`}{" "}
            Aulas sem status não entram no seu pagamento. &quot;Aula dada&quot; e &quot;Aluno faltou&quot; são pagas;
            &quot;Cancelada por mim&quot; não é paga e dá 1 crédito de reposição ao aluno.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {classes.map((c) => (
          <div key={c.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(c.startAt), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            <Select
              value={selected[c.id] ?? ""}
              onValueChange={(v) => setSelected((prev) => ({ ...prev, [c.id]: v as ResolvedStatus }))}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="O que aconteceu?" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => handleSave(c)}
              disabled={!selected[c.id] || savingId !== null}
            >
              {savingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        ))}
      </div>

      {!isBlocked && (
        <Link href="/hub" className="self-start">
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
