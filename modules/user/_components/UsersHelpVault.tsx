"use client";

import {
  Vault,
  VaultBody,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultIcon,
} from "@/components/ui/vault";
import { useParams } from "next/navigation";
import { Info, HelpCircle } from "lucide-react";

interface UsersHelpVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersHelpVault({ open, onOpenChange }: UsersHelpVaultProps) {
  const { locale } = useParams();
  const isEn = locale === "en";

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-xl">
        <VaultIcon type="info" />
        <VaultHeader>
          <VaultTitle>
            {isEn ? "Billing & Registration Guide" : "Manual de Faturamento e Matrícula"}
          </VaultTitle>
          <VaultDescription>
            {isEn
              ? "Understand how student onboarding and prorated billing values are calculated."
              : "Entenda como funcionam as regras de matrícula de alunos e o cálculo de cobrança proporcional (Pró-rata)."}
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section: Pro-rata explanation */}
          <div className="card p-4 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" />
              <span>
                {isEn ? "How Prorated Billing Works" : "Como funciona a cobrança Proporcional (Pró-rata)"}
              </span>
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isEn
                ? "When a student starts their classes, the system splits the plan's monthly value into 4 equal weekly parts. Depending on the chosen classes start date, we calculate the remaining weeks of the current billing cycle. This calculation remains consistent regardless of whether the plan has 2, 3, or more classes per week."
                : "Quando um aluno é matriculado, o sistema divide o valor da mensalidade em 4 partes semanais fictícias. Dependendo do dia de início escolhido para as aulas, cobramos apenas o equivalente às semanas restantes do primeiro mês. Esse cálculo é baseado na data e é o mesmo se o plano contratado tem 2, 3 ou mais aulas por semana."}
            </p>
          </div>

          {/* Section: Rule Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {isEn ? "Prorated Intervals & Due Dates" : "Intervalos Pró-rata e Vencimentos"}
            </h4>

            <div className="border border-gray-200/50 dark:border-gray-700/50 rounded-lg overflow-hidden">
              <table className="w-full border-collapse text-xs text-left">
                <thead>
                  <tr className="bg-gray-50 dark:bg-zinc-900 border-b border-gray-200/50 dark:border-gray-700/50 text-muted-foreground font-medium">
                    <th className="p-3">{isEn ? "Day of Start" : "Dia de Início"}</th>
                    <th className="p-3">{isEn ? "Charged Value" : "Valor Cobrado"}</th>
                    <th className="p-3">{isEn ? "First Due Date" : "1º Vencimento"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  <tr className="item hover:bg-zinc-500/5">
                    <td className="p-3 font-medium text-foreground">{isEn ? "Day 1 to 5" : "Dia 1 ao 5"}</td>
                    <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">100% {isEn ? "(Full)" : "(Integral)"}</td>
                    <td className="p-3 text-muted-foreground">{isEn ? "Start Date + 10 Days" : "Data de Início + 10 dias"}</td>
                  </tr>
                  <tr className="item hover:bg-zinc-500/5">
                    <td className="p-3 font-medium text-foreground">{isEn ? "Day 6 to 14" : "Dia 6 ao 14"}</td>
                    <td className="p-3 text-primary font-semibold">75% {isEn ? "(3/4 Weeks)" : "(3/4 Semanas)"}</td>
                    <td className="p-3 text-muted-foreground">{isEn ? "Start Date + 10 Days" : "Data de Início + 10 dias"}</td>
                  </tr>
                  <tr className="item hover:bg-zinc-500/5">
                    <td className="p-3 font-medium text-foreground">{isEn ? "Day 15 to 19" : "Dia 15 ao 19"}</td>
                    <td className="p-3 text-primary font-semibold">50% {isEn ? "(2/4 Weeks)" : "(2/4 Semanas)"}</td>
                    <td className="p-3 text-muted-foreground">{isEn ? "Start Date + 10 Days" : "Data de Início + 10 dias"}</td>
                  </tr>
                  <tr className="item hover:bg-zinc-500/5">
                    <td className="p-3 font-medium text-foreground">{isEn ? "Day 20 onwards" : "Dia 20 em diante"}</td>
                    <td className="p-3 text-primary font-semibold">25% {isEn ? "(1/4 Week)" : "(1/4 Semana)"}</td>
                    <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">{isEn ? "End of Month" : "Último dia do mês atual"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Additional Onboarding Tips */}
          <div className="card p-4 flex gap-3 items-start bg-gray-50/50 dark:bg-white/5 border-gray-200/50 dark:border-gray-700/50">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground block">
                {isEn ? "Important Billing Notes" : "Notas de Faturamento Importantes"}
              </span>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isEn
                  ? "For billing cycles starting on day 20 or later, because the first due date falls on the last day of the current month, subsequent invoices will align normally to the selected due day in the following months."
                  : "Para faturamentos iniciados a partir do dia 20, como o vencimento da primeira parcela ocorre no último dia do próprio mês, os meses seguintes serão ajustados para vencer normalmente no dia de vencimento escolhido para o aluno."}
              </p>
            </div>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
