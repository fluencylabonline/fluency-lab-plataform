import { Wizard } from "@/components/ui/wizard";
import { useTranslations } from "next-intl";
import {
  Wallet,
  LandmarkIcon,
  PiggyBank,
  Filter,
  TrendingUp,
  PlusCircle,
  LayoutDashboard
} from "lucide-react";

interface FinanceHelpWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinanceHelpWizard({ open, onOpenChange }: FinanceHelpWizardProps) {
  const t = useTranslations("AdminFinances.help");

  const steps = [
    {
      id: "intro",
      title: t("intro.title") || "Bem-vindo às Finanças",
      description: t("intro.description") || "O centro de controle econômico da sua escola.",
      icon: Wallet,
      headerBg: "bg-primary/10",
      iconColor: "text-primary",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Este módulo automatiza a gestão financeira da FluencyLab. Aqui você centraliza receitas de mensalidades,
            despesas com professores e impostos.
          </p>
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <LandmarkIcon size={16} /> Regime de Caixa
            </h4>
            <p>
              Importante: Todos os cálculos de lucro e IRPF usam o <strong>Regime de Caixa</strong>. Isso significa que apenas o que foi
              marcado como &quot;Pago&quot; ou &quot;Recebido&quot; entra nas métricas reais.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[12px]">
            <p>
              <strong>✨ Integração Automática:</strong> Os pagamentos processados no módulo de Professores são lançados
              automaticamente aqui como despesas. Você não precisa cadastrá-los manualmente!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "dashboard",
      title: "Navegação e Filtros",
      description: "Como explorar os dados financeiros.",
      icon: Filter,
      headerBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            A barra superior permite filtrar todo o dashboard por <strong>Mês, Ano e Status</strong>.
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Visão Anual:</strong> Selecione &quot;Todos os meses&quot; para ver o acumulado do ano e o IRPF total.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Métrica Mensal:</strong> Ao selecionar um mês, os cards de métricas ganham uma linha extra destacada com o <strong>Total do Mês</strong>.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "status",
      title: "O Ciclo da Transação",
      description: "A diferença entre os status.",
      icon: LayoutDashboard,
      headerBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="grid gap-3">
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:bg-amber-50/10">
              <strong className="text-amber-700 block text-xs uppercase">Pendente</strong>
              <p className="text-xs">É uma previsão. Aparece nas <strong>Projeções</strong> mas não no Lucro Real.</p>
            </div>
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-50/10">
              <strong className="text-emerald-700 block text-xs uppercase">Pago / Recebido</strong>
              <p className="text-xs">É dinheiro na conta. Atualiza imediatamente o <strong>Lucro e o IRPF</strong>.</p>
            </div>
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 dark:bg-rose-50/10">
              <strong className="text-rose-700 block text-xs uppercase">Cancelado</strong>
              <p className="text-xs">Apenas registro histórico. Não afeta nenhum cálculo.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "projections",
      title: "Projeções (Forecast)",
      description: "O que esperar para os próximos meses.",
      icon: TrendingUp,
      headerBg: "bg-purple-500/10",
      iconColor: "text-purple-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Os cards de Projeção mostram o que ainda está por vir:
          </p>
          <ul className="space-y-2">
            <li><strong>Receita Projetada:</strong> Soma de mensalidades pendentes no período.</li>
            <li><strong>Despesas Pendentes:</strong> Contas a pagar já cadastradas com status pendente.</li>
          </ul>
          <p className="text-xs italic">
            Dica: Clique em &quot;Ver Projeção Detalhada&quot; para ver a lista de quais alunos e quais contas compõem esses valores.
          </p>
        </div>
      ),
    },
    {
      id: "fiscal",
      title: "Controle Fiscal (MEI)",
      description: "Como o sistema ajuda no seu IRPF.",
      icon: PiggyBank,
      headerBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      content: (
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            O card de <strong>IRPF Estimado</strong> usa 3 fatores:
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Isenção MEI:</strong> 32% da sua receita é livre de imposto por lei.</li>
            <li><strong>Despesas Dedutíveis:</strong> Pagamentos de professores e custos marcados como &quot;dedutíveis&quot; abatem o imposto.</li>
            <li><strong>Tabela Progressiva:</strong> O sistema aplica as alíquotas oficiais sobre o lucro tributável anual.</li>
          </ol>
          <p className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-50/10 p-2 rounded-lg border border-blue-100">
            Dica: Use o botão &quot;Configuração Fiscal&quot; para atualizar as tabelas do governo anualmente.
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      title: "Como Operar",
      description: "Adicionando e editando dados.",
      icon: PlusCircle,
      headerBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Para manter o sistema atualizado:
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <PlusCircle size={14} className="text-orange-500" />
              <span><strong>Nova Transação:</strong> Use para cadastrar despesas (aluguel, marketing) ou receitas extras.</span>
            </div>
            <div className="flex items-center gap-2">
              <LayoutDashboard size={14} className="text-orange-500" />
              <span><strong>Edição:</strong> Clique em qualquer transação na tabela para mudar o status para &quot;Pago&quot; ou anexar comprovantes.</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      submitLabel={t("close") || "Começar a Gerenciar!"}
      onComplete={() => onOpenChange(false)}
    />
  );
}
