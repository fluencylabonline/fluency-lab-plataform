"use client";

import { useState } from "react";
import { Megaphone, Send, Users, FlaskConical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultIcon,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { sendDelinquencyPolicyAnnouncementAction } from "@/modules/communication/communication.actions";

type Mode = "dryRun" | "test" | "send";

function firstDayOfNextMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
}

/**
 * Envia por email o comunicado das regras de inadimplência para todos os
 * alunos e professores ativos. A data informada deve ser a mesma configurada
 * em DELINQUENCY_POLICY_START: é a partir dela que as regras valem.
 */
export function DelinquencyAnnouncementCard() {
  const [startDate, setStartDate] = useState(firstDayOfNextMonth);
  const [loading, setLoading] = useState<Mode | null>(null);
  const [counts, setCounts] = useState<{ students: number; teachers: number } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = async (mode: Mode) => {
    setLoading(mode);
    const result = await sendDelinquencyPolicyAnnouncementAction({ mode, startDate });
    setLoading(null);

    const data = result?.data;
    if (!data?.success) {
      notify.error(data?.error || "Erro ao processar o comunicado.");
      return;
    }
    setCounts({ students: data.students, teachers: data.teachers });

    if (mode === "dryRun") {
      notify.info(`${data.students} aluno(s) e ${data.teachers} professor(es) ativos receberão o comunicado.`);
    } else if (mode === "test") {
      notify.success("Enviamos as duas versões (aluno e professor) para o seu email.");
    } else if (data.failed > 0) {
      notify.error(`Enviados: ${data.sent}. Falharam: ${data.failed}. Veja os logs do servidor.`);
    } else {
      notify.success(`Comunicado enviado para ${data.sent} pessoa(s).`);
    }
  };

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/20">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Comunicado: regras de inadimplência</h3>
          <p className="text-xs text-muted-foreground">
            Explica por email os lembretes, o bloqueio de acesso, o cancelamento das aulas sem reposição e o cancelamento automático da matrícula.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="delinquency-start" className="text-sm font-medium">
          As regras valem para mensalidades com vencimento a partir de
        </label>
        <input
          id="delinquency-start"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:w-56 rounded-md border bg-background px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Use a mesma data configurada em DELINQUENCY_POLICY_START.
        </p>
      </div>

      {counts && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Users className="w-4 h-4" />
          {counts.students} aluno(s) e {counts.teachers} professor(es) ativos
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => run("dryRun")} disabled={!!loading || !startDate} className="gap-2">
          {loading === "dryRun" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
          Contar destinatários
        </Button>
        <Button variant="outline" onClick={() => run("test")} disabled={!!loading || !startDate} className="gap-2">
          {loading === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
          Enviar teste para mim
        </Button>
        <Button onClick={() => setConfirmOpen(true)} disabled={!!loading || !startDate} className="gap-2">
          {loading === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Enviar para todos
        </Button>
      </div>

      <Vault open={confirmOpen} onOpenChange={setConfirmOpen}>
        <VaultContent className="sm:max-w-md">
          <VaultHeader>
            <VaultIcon type="info" />
            <VaultTitle>Enviar o comunicado para todos?</VaultTitle>
            <VaultDescription>
              Todos os alunos e professores ativos vão receber o email com as regras de inadimplência valendo a partir de{" "}
              <strong>{startDate.split("-").reverse().join("/")}</strong>. Não dá para desfazer o envio.
            </VaultDescription>
          </VaultHeader>
          <VaultFooter className="mt-6 flex justify-end gap-3">
            <VaultSecondaryButton onClick={() => setConfirmOpen(false)}>Cancelar</VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={async () => {
                setConfirmOpen(false);
                await run("send");
              }}
            >
              Enviar
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
