"use client";

import { Header } from "@/components/layout/header";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { FinanceHelpWizard } from "./FinanceHelpWizard";
import { useTranslations } from "next-intl";

interface FinanceHeaderProps {
  title: string;
  subtitle: string;
}

export function FinanceHeader({ title, subtitle }: FinanceHeaderProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const t = useTranslations("AdminFinances");

  return (
    <>
      <Header 
        title={title} 
        subtitle={subtitle}
        actions={[{
          label: t("helpLabel") || "Ajuda",
          icon: <HelpCircle className="w-4 h-4" />,
          onClick: () => setHelpOpen(true)
        }]}
        className="contents"
      />
      <FinanceHelpWizard open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
