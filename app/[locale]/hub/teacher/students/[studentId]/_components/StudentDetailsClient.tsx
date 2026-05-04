"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { SlotInstanceWithDetails } from "@/modules/scheduling/scheduling.types";
import type { Notebook } from "@/modules/notebook/notebook.schema";
import {
  BookOpen,
  Target,
} from "lucide-react";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";
import { StudentNotebooksCard } from "./StudentNotebooksCard";
import { StudentPlanCard } from "./StudentPlanCard";
import { StudentClassesCard } from "./StudentClassesCard";

interface StudentDetailsClientProps {
  studentId: string;
  studentName: string;
  initialClasses: SlotInstanceWithDetails[];
  initialNotebooks: Notebook[];
}

export function StudentDetailsClient({
  studentId,
  studentName,
  initialClasses,
  initialNotebooks,
}: StudentDetailsClientProps) {
  const [isNotebooksOpen, setIsNotebooksOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);

  // Botões de ação para o Header (Apenas Mobile)
  const headerActions = [
    {
      id: "notebooks",
      icon: <BookOpen className="h-5 w-5" />,
      onClick: () => setIsNotebooksOpen(true),
      className: "lg:hidden" // Esconde no desktop
    },
    {
      id: "plan",
      icon: <Target className="h-5 w-5" />,
      onClick: () => setIsPlanOpen(true),
      className: "lg:hidden" // Esconde no desktop
    }
  ];

  return (
    <div>
      <Header
        title={studentName}
        showSubHeader={false}
        actions={headerActions}
        className="contents"
      />

      <main className="container">
        {/* Layout Desktop (3 Colunas) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-3">
          <div className="h-[calc(100vh-110px)]">
            <StudentNotebooksCard studentId={studentId} initialNotebooks={initialNotebooks} />
          </div>
          <div className="h-[calc(100vh-110px)]">
            <StudentPlanCard studentId={studentId} />
          </div>
          <div className="h-[calc(100vh-110px)] overflow-y-auto no-scrollbar">
            <StudentClassesCard
              studentId={studentId}
              initialData={initialClasses}
            />
          </div>
        </div>

        {/* Layout Mobile (Apenas Classes) */}
        <div className="lg:hidden h-[calc(100vh-150px)] overflow-y-auto no-scrollbar">
          <StudentClassesCard
            studentId={studentId}
            initialData={initialClasses}
            isMobileMode={true}
          />
        </div>
      </main>

      {/* Vaults para Mobile */}
      <Vault open={isNotebooksOpen} onOpenChange={setIsNotebooksOpen}>
        <VaultContent className="max-w-4xl h-[90vh]">
          <VaultHeader>
            <VaultTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Notebooks
            </VaultTitle>
            <VaultDescription>
              Cadernos de aula e materiais do aluno.
            </VaultDescription>
          </VaultHeader>
          <VaultBody className="p-0 h-full overflow-hidden">
            <StudentNotebooksCard studentId={studentId} initialNotebooks={initialNotebooks} isVaultMode={true} />
          </VaultBody>
        </VaultContent>
      </Vault>

      <Vault open={isPlanOpen} onOpenChange={setIsPlanOpen}>
        <VaultContent className="max-w-4xl h-[90vh]">
          <VaultHeader>
            <VaultTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Plano de Estudos
            </VaultTitle>
            <VaultDescription>
              Progresso e lições agendadas.
            </VaultDescription>
          </VaultHeader>
          <VaultBody className="p-0 h-full overflow-hidden">
            <StudentPlanCard studentId={studentId} isVaultMode={true} />
          </VaultBody>
        </VaultContent>
      </Vault>
    </div>
  );
}
