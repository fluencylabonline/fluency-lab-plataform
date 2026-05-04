"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";
import { StudentLearningStats, LearningItemDetail, StudentRoadmap } from "@/modules/learning/learning.types";
import {
  Sparkles,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { StatsDashboard } from "./StatsDashboard";
import { LearningPath } from "./LearningPath";
import { NotebooksCard } from "./NotebooksCard";
import { WordOfTheDayVault } from "./WordOfTheDayVault";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";

import { Notebook } from "@/modules/notebook/notebook.schema";

interface StudentNotebookClientProps {
  stats: StudentLearningStats;
  learnedItems: LearningItemDetail[];
  reviewedItems: LearningItemDetail[];
  roadmap: StudentRoadmap | null;
  initialNotebooks: Notebook[];
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function StudentNotebookClient({
  stats,
  learnedItems,
  reviewedItems,
  roadmap,
  initialNotebooks,
  user
}: StudentNotebookClientProps) {
  const t = useTranslations("NotebookHub");
  const [wordOfTheDayOpen, setWordOfTheDayOpen] = useState(false);
  const [notebooksOpen, setNotebooksOpen] = useState(false);

  return (
    <div>
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={user}
        actions={[
          {
            label: t("notebooksLabel"),
            icon: <BookOpen className="w-4 h-4" />,
            onClick: () => setNotebooksOpen(true),
            className: "lg:hidden"
          },
          {
            label: t("wordOfTheDayLabel"),
            icon: <Sparkles className="w-4 h-4" />,
            onClick: () => setWordOfTheDayOpen(true)
          }
        ]}
      />

      <main className="container">
        {/* Mobile Stats Dashboard (Horizontal) */}
        <div className="lg:hidden mb-6">
          <StatsDashboard
            stats={stats}
            learnedItems={learnedItems}
            reviewedItems={reviewedItems}
            variant="horizontal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
          {/* Column 1: Notebooks (Desktop only) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24 overflow-hidden">
            <NotebooksCard
              initialNotebooks={initialNotebooks}
              studentName={user.name || "Estudante"}
            />
          </section>

          {/* Column 2: Learning Path (Desktop & Mobile) */}
          <section className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between lg:hidden px-1">
              <h2 className="text-lg font-bold tracking-tight">{t("myProgress")}</h2>
              <button
                onClick={() => setNotebooksOpen(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1"
              >
                {t("viewNotebooks")} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <LearningPath lessons={roadmap?.lessons || []} />
          </section>

          {/* Column 3: Stats (Desktop only - Vertical) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24">
            <StatsDashboard
              stats={stats}
              learnedItems={learnedItems}
              reviewedItems={reviewedItems}
              variant="vertical"
            />
          </section>
        </div>
      </main>

      {/* Mobile Notebooks Vault */}
      <Vault open={notebooksOpen} onOpenChange={setNotebooksOpen}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("vaultTitle")}</VaultTitle>
            <VaultDescription>{t("vaultDescription")}</VaultDescription>
          </VaultHeader>
          <VaultBody className="p-0">
            <NotebooksCard
              isVaultMode={true}
              initialNotebooks={initialNotebooks}
              studentName={user.name || "Estudante"}
            />
          </VaultBody>
        </VaultContent>
      </Vault>

      <WordOfTheDayVault
        open={wordOfTheDayOpen}
        onOpenChange={setWordOfTheDayOpen}
      />
    </div>
  );
}
