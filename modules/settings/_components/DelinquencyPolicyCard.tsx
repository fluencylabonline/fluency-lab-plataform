"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Megaphone, Send, Users, FlaskConical, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  updateDelinquencyPolicySchema,
  type SystemSettings,
  type UpdateDelinquencyPolicyValues,
} from "@/modules/settings/settings.schema";
import { updateDelinquencyPolicyAction } from "@/modules/settings/settings.actions";
import { sendDelinquencyPolicyAnnouncementAction } from "@/modules/communication/communication.actions";

type AnnouncementMode = "dryRun" | "test" | "send";
type ConfirmKind = "enable" | "send" | null;

function firstDayOfNextMonth() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
}

const toBr = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

/**
 * Liga/desliga a política de inadimplência (bloqueio de acesso, cancelamento
 * das aulas e da matrícula) e dispara o comunicado das regras. Fluxo sugerido:
 * enviar o comunicado, esperar os alunos regularizarem e só então ativar.
 */
export function DelinquencyPolicyCard({ initialSettings }: { initialSettings: SystemSettings }) {
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<AnnouncementMode | null>(null);
  const [counts, setCounts] = useState<{ students: number; teachers: number } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const form = useForm<UpdateDelinquencyPolicyValues>({
    resolver: zodResolver(updateDelinquencyPolicySchema),
    defaultValues: {
      enabled: initialSettings.delinquencyPolicyEnabled,
      startDate: initialSettings.delinquencyPolicyStart ?? firstDayOfNextMonth(),
      autoCancelEnabled: initialSettings.delinquencyAutoCancelEnabled,
    },
  });
  const enabled = useWatch({ control: form.control, name: "enabled" });
  const startDate = useWatch({ control: form.control, name: "startDate" });
  const wasEnabled = initialSettings.delinquencyPolicyEnabled;

  const save = async (values: UpdateDelinquencyPolicyValues) => {
    setSaving(true);
    const result = await updateDelinquencyPolicyAction(values);
    setSaving(false);
    if (result?.data?.success) {
      notify.success(values.enabled ? "Política de inadimplência ativada." : "Política de inadimplência salva (desativada).");
      form.reset(values);
    } else {
      notify.error(result?.data?.error || "Erro ao salvar a política.");
    }
  };

  // Ligar a política bloqueia na hora quem já está em atraso: pede confirmação.
  const onSubmit = form.handleSubmit((values) => {
    if (values.enabled && !wasEnabled) setConfirm("enable");
    else void save(values);
  });

  const runAnnouncement = async (mode: AnnouncementMode) => {
    if (!startDate) return;
    setSending(mode);
    const result = await sendDelinquencyPolicyAnnouncementAction({ mode, startDate });
    setSending(null);

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

  const busy = saving || !!sending;

  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20">
          <Lock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Política de inadimplência</h3>
          <p className="text-xs text-muted-foreground">
            Bloqueio do acesso no mês seguinte ao vencimento, cancelamento das aulas sem reposição e cancelamento da matrícula. Desligada, só os lembretes de atraso são enviados.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Ativar bloqueio por falta de pagamento</span>
            <span className="block text-xs text-muted-foreground">
              Sugestão: envie o comunicado abaixo, espere os alunos regularizarem e só então ative.
            </span>
          </span>
          <Controller
            control={form.control}
            name="enabled"
            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
          />
        </label>

        <div className="space-y-1.5">
          <label htmlFor="delinquency-start" className="text-sm font-medium">
            Vale para mensalidades com vencimento a partir de
          </label>
          <input
            id="delinquency-start"
            type="date"
            {...form.register("startDate")}
            className="w-full sm:w-56 rounded-md border bg-background px-3 py-2 text-sm"
          />
          {form.formState.errors.startDate && (
            <p className="text-xs text-red-600">{form.formState.errors.startDate.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Parcelas que venceram antes dessa data só recebem lembretes, nunca bloqueiam ninguém.
          </p>
        </div>

        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">Cancelar matrícula automaticamente</span>
            <span className="block text-xs text-muted-foreground">
              No fim do mês de bloqueio sem pagamento, cancela a matrícula sem multa. Desligado, os admins recebem por email a lista de quem seria cancelado.
            </span>
          </span>
          <Controller
            control={form.control}
            name="autoCancelEnabled"
            render={({ field }) => (
              <Switch checked={field.value && enabled} onCheckedChange={field.onChange} disabled={!enabled} />
            )}
          />
        </label>

        <Button type="submit" disabled={busy || !form.formState.isDirty} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar política
        </Button>
      </form>

      <div className="border-t pt-6 space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-semibold">Comunicado para alunos e professores</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Explica por email os lembretes, o bloqueio, o cancelamento das aulas sem reposição e o cancelamento da matrícula, citando a data acima
          {startDate ? ` (${toBr(startDate)})` : ""}.
        </p>

        {counts && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            {counts.students} aluno(s) e {counts.teachers} professor(es) ativos
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => runAnnouncement("dryRun")} disabled={busy || !startDate} className="gap-2">
            {sending === "dryRun" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Contar destinatários
          </Button>
          <Button variant="outline" onClick={() => runAnnouncement("test")} disabled={busy || !startDate} className="gap-2">
            {sending === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            Enviar teste para mim
          </Button>
          <Button onClick={() => setConfirm("send")} disabled={busy || !startDate} className="gap-2">
            {sending === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar para todos
          </Button>
        </div>
      </div>

      <Vault open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <VaultContent className="sm:max-w-md">
          <VaultHeader>
            <VaultIcon type="warning" />
            <VaultTitle>{confirm === "enable" ? "Ativar o bloqueio agora?" : "Enviar o comunicado para todos?"}</VaultTitle>
            <VaultDescription>
              {confirm === "enable" ? (
                <>
                  Alunos com mensalidade vencida a partir de <strong>{toBr(startDate)}</strong> num mês anterior ao atual
                  passam a ver só a página de pagamento imediatamente, e as aulas deles começam a ser canceladas no dia anterior.
                </>
              ) : (
                <>
                  Todos os alunos e professores ativos vão receber o email com as regras valendo a partir de{" "}
                  <strong>{toBr(startDate)}</strong>. Não dá para desfazer o envio.
                </>
              )}
            </VaultDescription>
          </VaultHeader>
          <VaultFooter className="mt-6 flex justify-end gap-3">
            <VaultSecondaryButton onClick={() => setConfirm(null)}>Cancelar</VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={async () => {
                const kind = confirm;
                setConfirm(null);
                if (kind === "enable") await save(form.getValues());
                else await runAnnouncement("send");
              }}
            >
              {confirm === "enable" ? "Ativar" : "Enviar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
