"use client";

import { Wizard } from "@/components/ui/wizard";
import { Users, UserMinus, Search } from "lucide-react";

interface TeacherStudentsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function TeacherStudentsWizard({ open, onOpenChange, onComplete }: TeacherStudentsWizardProps) {
  const steps = [
    {
      id: "visibility",
      title: "Como os alunos aparecem?",
      description: "Entenda o vínculo de alunos com seu perfil.",
      icon: Users,
      headerBg: "bg-primary/10",
      iconColor: "text-primary",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Um aluno é exibido na sua lista de estudantes automaticamente se ele atender a pelo menos um dos seguintes critérios:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Possui uma aula futura ou recorrente agendada com você.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span>Já realizou alguma aula no passado cujo registro de presença ou histórico de agendamento esteja sob sua responsabilidade.</span>
            </li>
          </ul>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[12px] text-foreground">
            <p>
              <strong>💡 Vínculo Dinâmico:</strong> Não é necessário associar alunos manualmente. Assim que a equipe de suporte ou o sistema agenda uma aula deles com você, eles aparecem aqui instantaneamente.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "disappearance",
      title: "Quando um aluno desaparece?",
      description: "Entenda quando um estudante sai da sua listagem.",
      icon: UserMinus,
      headerBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Um aluno deixará de ser listado na sua central se:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>Ele não possuir mais nenhuma aula ativa, pendente ou concluída agendada com você no banco de dados.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>O contrato ou pacote de aulas dele for finalizado e a coordenação reatribuir o aluno inteiramente a outro professor.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "search",
      title: "Como usar a busca?",
      description: "Encontre seus alunos de forma rápida.",
      icon: Search,
      headerBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            A barra de pesquisa no cabeçalho permite que você encontre qualquer estudante em tempo real.
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Busca por Nome:</strong> Digite parte do nome do aluno para filtrar a lista.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span><strong>Busca por E-mail:</strong> Também é possível buscar pelo endereço de e-mail cadastrado do aluno.</span>
            </li>
          </ul>
          <p className="text-xs italic">
            Dica: Se a lista estiver vazia e a busca ativa, clique no &quot;X&quot; da barra de pesquisa para redefinir e ver todos os alunos de volta.
          </p>
        </div>
      ),
    },
  ];

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      onComplete={() => {
        onComplete?.();
        onOpenChange(false);
      }}
    />
  );
}
