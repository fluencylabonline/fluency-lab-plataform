"use client";

import { Wizard } from "@/components/ui/wizard";
import { Calendar, Notebook as NotebookIcon, Goal, Video } from "lucide-react";

interface StudentDetailsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function StudentDetailsWizard({ open, onOpenChange, onComplete }: StudentDetailsWizardProps) {
  const steps = [
    {
      id: "classes",
      title: "Histórico de Aulas",
      description: "Acompanhe e registre a presença e o feedback.",
      icon: Calendar,
      headerBg: "bg-primary/10",
      iconColor: "text-primary",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            No painel de <strong>Aulas</strong>, você visualiza o calendário mensal do estudante e gerencia os agendamentos.
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Registrar Presença:</strong> Marque se o aluno compareceu ou se houve falta/desmarcação.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              <span><strong>Feedback de Aula:</strong> Escreva um breve resumo pedagógico sobre o desempenho do aluno após cada encontro.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "notebooks",
      title: "Notebooks (Anotações)",
      description: "Caderno digital compartilhado com o estudante.",
      icon: NotebookIcon,
      headerBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Os <strong>Notebooks</strong> servem como o diário de bordo e espaço de anotações oficiais de cada aula.
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>Crie anotações ricas com explicações gramaticais, novos vocabulários e observações.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span>O aluno tem acesso de leitura instantâneo aos notebooks que você cria, permitindo que ele estude de qualquer lugar.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <span><strong>Busca Inteligente:</strong> Você pode usar a busca dos cadernos para pesquisar palavras-chave contidas tanto no <strong>título</strong> quanto no <strong>conteúdo</strong> das anotações.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "live-classes",
      title: "Aulas ao Vivo (Vídeo)",
      description: "Como realizar e iniciar as chamadas de vídeo.",
      icon: Video,
      headerBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            As aulas online são realizadas diretamente de forma integrada à plataforma:
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Acesse o notebook específico da aula e clique no <strong>botão de vídeo</strong> (câmera) no canto inferior direito para abrir a sala.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <span>Não é necessário enviar links! Assim que você inicia a chamada, ela aparece automaticamente para o aluno quando ele acessa a plataforma.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "roadmap",
      title: "Plano de Estudos",
      description: "A trilha pedagógica e progresso do aluno.",
      icon: Goal,
      headerBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            O <strong>Plano de Estudos</strong> define a sequência de lições estruturadas que o aluno irá cursar.
          </p>
          <ul className="space-y-2">
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Adicione lições da biblioteca oficial para criar um roteiro sob medida.</span>
            </li>
            <li className="flex gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <span>Acompanhe o status de conclusão de cada lição e o progresso da prática diária do estudante.</span>
            </li>
          </ul>
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
