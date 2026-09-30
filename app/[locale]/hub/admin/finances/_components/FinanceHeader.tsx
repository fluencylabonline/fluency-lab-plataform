"use client";

import { Header } from "@/components/layout/header";
import { useState } from "react";
import { FinanceHelpWizard } from "./FinanceHelpWizard";
import { useRegisterPageHelp } from "@/modules/page-help/_components/PageHelpProvider";

interface FinanceHeaderProps {
  title: string;
  subtitle: string;
}

export function FinanceHeader({ title, subtitle }: FinanceHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  // O (?) do header abre este wizard. Ver .agents/rules/page-help.md
  useRegisterPageHelp(setHelpOpen);

  return (
    <>
      <Header
        title={title}
        subtitle={subtitle}
        className="contents"
      />
      <FinanceHelpWizard open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
