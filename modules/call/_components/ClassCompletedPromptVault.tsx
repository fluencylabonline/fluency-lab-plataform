"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallStore } from "@/hooks/data/use-call-store";
import { notify } from "@/components/ui/toaster";
import {
  findClassesForCallEndAction,
  updateClassStatusAction,
} from "@/modules/scheduling/scheduling.actions";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import { cn } from "@/lib/utils";

interface CandidateClass {
  id: string;
  startAt: string;
  studentName: string;
}

const formatClass = (c: CandidateClass) =>
  `${c.studentName} · ${format(new Date(c.startAt), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}`;

/**
 * Depois que o professor encerra uma chamada longa, pergunta se a aula foi dada.
 * A chamada não tem vínculo com a aula, então casamos pelo horário em que ele
 * desligou; sem aula nesse horário, ele escolhe entre as aulas sem status.
 */
export function ClassCompletedPromptVault() {
  const prompt = useCallStore((s) => s.postCallPrompt);
  const setPostCallPrompt = useCallStore((s) => s.setPostCallPrompt);

  const [matches, setMatches] = useState<CandidateClass[]>([]);
  const [others, setOthers] = useState<CandidateClass[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!prompt) return;
    let cancelled = false;
    (async () => {
      const result = await findClassesForCallEndAction({
        studentId: prompt.studentId,
        endedAt: prompt.endedAt,
      });
      if (cancelled) return;
      const m = result?.data?.matches ?? [];
      const o = result?.data?.others ?? [];
      // Nenhuma aula sem status para marcar: nada a perguntar.
      if (m.length === 0 && o.length === 0) {
        setPostCallPrompt(null);
        return;
      }
      setMatches(m);
      setOthers(o);
      setPicked(m.length === 1 ? m[0].id : null);
      setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [prompt, setPostCallPrompt]);

  const close = () => {
    setOpen(false);
    setPostCallPrompt(null);
  };

  const confirm = async () => {
    if (!picked) return;
    setSaving(true);
    const result = await updateClassStatusAction({ classId: picked, status: "completed" });
    setSaving(false);
    if (result?.data?.success) {
      notify.success("Aula marcada como dada.");
      close();
    } else {
      notify.error(result?.data?.error || "Não foi possível marcar a aula.");
    }
  };

  const single = matches.length === 1 ? matches[0] : null;
  const choices = matches.length > 0 ? matches : others;

  return (
    <Vault open={open} onClose={close}>
      <VaultContent>
        <VaultHeader>
          <VaultIcon type="warning" />
          <div className="flex flex-col">
            <VaultTitle>{single ? "Marcar como aula dada?" : "Qual aula foi dada?"}</VaultTitle>
            <VaultDescription>
              {single ? (
                <>
                  A chamada durou mais de 20 minutos. Marcar a aula de <strong>{formatClass(single)}</strong> como dada?
                </>
              ) : (
                "A chamada durou mais de 20 minutos. Escolha a aula que foi dada para marcá-la como dada."
              )}
            </VaultDescription>
          </div>
        </VaultHeader>
        {!single && (
          <VaultBody>
            <div className="flex flex-col gap-2">
              {choices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPicked(c.id)}
                  className={cn(
                    "text-left text-sm p-3 rounded-md border transition-colors",
                    picked === c.id ? "border-primary bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  {formatClass(c)}
                </button>
              ))}
            </div>
          </VaultBody>
        )}
        <VaultFooter>
          <VaultSecondaryButton onClick={close} disabled={saving}>
            Agora não
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={confirm} disabled={!picked || saving}>
            {saving ? "Processando..." : "Sim, aula dada"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
