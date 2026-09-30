"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { useTranslations } from "next-intl";
import { StudentLearningStats, LearningItemDetail, StudentRoadmap } from "@/modules/learning/learning.types";
import { LearningItem } from "@/modules/curriculum/curriculum.types";
import {
  Sparkles,
  ChevronRight,
  BookMarkedIcon
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
import { StudentHelpWizard } from "../../_components/StudentHelpWizard";
import { useWizard } from "@/hooks/ui/use-wizard";
import { useRegisterPageHelp } from "@/modules/page-help/_components/PageHelpProvider";

interface StudentNotebookClientProps {
  stats: StudentLearningStats;
  learnedItems: LearningItemDetail[];
  reviewedItems: LearningItemDetail[];
  roadmap: StudentRoadmap | null;
  initialNotebooks: Notebook[];
  wordOfTheDay: LearningItem | null;
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
  wordOfTheDay,
  user
}: StudentNotebookClientProps) {
  const t = useTranslations("NotebookHub");
  const [notebooksOpen, setNotebooksOpen] = useState(false);
  const {
    isOpen: isHelpOpen,
    setIsOpen: setIsHelpOpen,
    completeWizard: handleCompleteHelp,
  } = useWizard("student-notebook");

  // O (?) do header abre este wizard. Ver .agents/rules/page-help.md
  useRegisterPageHelp(setIsHelpOpen);

  // Lazy initializers read localStorage once on mount — no extra render, no effect needed
  const [wordOfTheDayOpen, setWordOfTheDayOpen] = useState(() => {
    if (typeof window === "undefined" || !wordOfTheDay) return false;
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = localStorage.getItem("wotd_last_shown");
    if (lastShown !== today) {
      localStorage.setItem("wotd_last_shown", today);
      return true;
    }
    return false;
  });
  const [xpAlreadyClaimed, setXpAlreadyClaimed] = useState(() => {
    if (typeof window === "undefined") return false;
    const today = new Date().toISOString().slice(0, 10);
    return localStorage.getItem("wotd_xp_claimed") === today;
  });

  return (
    <div>
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={user}
        className="contents"
        actions={[
          {
            label: t("notebooksLabel"),
            icon: <BookMarkedIcon className="w-4 h-4" />,
            onClick: () => setNotebooksOpen(true),
            className: "lg:hidden",
            dataTour: "student-notebook.notebooks-button"
          },
          {
            label: t("wordOfTheDayLabel"),
            icon: <Sparkles className="w-4 h-4" />,
            onClick: () => setWordOfTheDayOpen(true),
            dataTour: "student-notebook.wotd"
          }
        ]}
      />

      <main className="container">
        {/* Mobile Stats Dashboard (Horizontal) */}
        <div className="lg:hidden mb-6" data-tour="student-notebook.stats">
          <StatsDashboard
            stats={stats}
            learnedItems={learnedItems}
            reviewedItems={reviewedItems}
            variant="horizontal"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
          {/* Column 1: Notebooks (Desktop only) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24 overflow-hidden" data-tour="student-notebook.notebooks">
            <NotebooksCard
              initialNotebooks={initialNotebooks}
              studentName={user.name || "Estudante"}
            />
          </section>

          {/* Column 2: Learning Path (Desktop & Mobile) */}
          <section className="lg:col-span-2 space-y-6 h-fit sm:h-[calc(100vh-10rem)]">
            <div className="flex items-center justify-between lg:hidden px-1">
              <h2 className="text-lg font-bold tracking-tight">{t("myProgress")}</h2>
              <button
                onClick={() => setNotebooksOpen(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-1"
              >
                {t("viewNotebooks")} <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div data-tour="student-notebook.path">
              <LearningPath lessons={roadmap?.lessons || []} />
            </div>
          </section>

          {/* Column 3: Stats (Desktop only - Vertical) */}
          <section className="hidden lg:block lg:col-span-1 h-[calc(100vh-10rem)] sticky top-24" data-tour="student-notebook.stats">
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
        item={wordOfTheDay}
        xpAlreadyClaimed={xpAlreadyClaimed}
        onXPClaimed={() => {
          setXpAlreadyClaimed(true);
          const today = new Date().toISOString().slice(0, 10);
          localStorage.setItem("wotd_xp_claimed", today);
        }}
      />

      <StudentHelpWizard
        page="notebook"
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onComplete={handleCompleteHelp}
      />
    </div>
  );
}
