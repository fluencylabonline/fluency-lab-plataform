"use client";

import { useTranslations, useFormatter } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Play, RotateCcw, Clock, Languages, ChevronRight, Loader2, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { mapEloToCEFR } from "@/lib/adaptive-scoring";
import { Vault, VaultContent, VaultHeader, VaultTitle, VaultDescription } from "@/components/ui/vault";
import { useState, useEffect } from "react";
import { ResultView, type PlacementResult } from "./ResultView";
import { getTestResultAction } from "@/modules/placement/placement.actions";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { StudentHelpWizard } from "../../_components/StudentHelpWizard";

interface PlacementHistoryItem {
  id: number;
  status: string | null;
  startedAt: Date | string | null;
  completedAt: Date | string | null;
  finalEloScore: number | null;
  languageId: string;
  language?: {
    name: string;
    code: string;
  };
}

interface LanguageItem {
  id: string;
  name: string;
  code: string;
}

interface PlacementDashboardProps {
  initialData: {
    history: PlacementHistoryItem[];
    activeTests: PlacementHistoryItem[];
    availableLanguages: LanguageItem[];
    eligibility: {
      isEligible: boolean;
      reason?: 'cooldown' | 'active_test';
      nextEligibleDate: Date | string | null | undefined;
      lastTestDate: Date | string | null | undefined;
    };
  };
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" as const },
  }),
};

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-muted-foreground/60">{icon}</span>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
        {children}
      </p>
    </div>
  );
}

export function PlacementDashboard({ initialData, user }: PlacementDashboardProps) {
  const t = useTranslations("Placement");
  const th = useTranslations("StudentHelpWizard");
  const format = useFormatter();
  const router = useRouter();
  const [selectedTestResult, setSelectedTestResult] = useState<PlacementResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("student-placement-wizard-seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsHelpOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCompleteHelp = () => {
    localStorage.setItem("student-placement-wizard-seen", "true");
  };

  const headerActions = [
    {
      icon: <HelpCircle className="h-5 w-5" />,
      onClick: () => setIsHelpOpen(true),
      label: th("common.helpLabel") || "Ajuda",
    },
  ];

  const handleViewResult = async (testId: number) => {
    setIsLoadingResult(true);
    setLoadingId(testId);
    try {
      const result = await getTestResultAction({ testId });
      if (result?.data) {
        setSelectedTestResult(result.data);
      } else {
        notify.error(t("errorLoadingResult") || "Could not load test results.");
      }
    } catch {
      notify.error(t("error") || "An unexpected error occurred");
    } finally {
      setIsLoadingResult(false);
      setLoadingId(null);
    }
  };

  const handleStartTest = (languageId: string) => {
    if (!initialData.eligibility.isEligible) {
      const errorMsg = initialData.eligibility.reason === 'active_test'
        ? t("activeTestDesc")
        : t("eligibilityError");
      notify.error(errorMsg || "You cannot start a new test at this time.");
      return;
    }
    router.push(`/hub/student/placement/test?languageId=${languageId}`);
  };

  const completedHistory = initialData.history.filter((t) => t.status === "completed");
  // const isCooldown = !initialData.eligibility.isEligible && initialData.eligibility.nextEligibleDate;

  return (
    <div>
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={user}
        backHref="/hub/student/profile"
        className="contents"
        actions={headerActions}
      />
      <main className="container">
        <div className="space-y-12">
      {/* ── Cooldown / Active Test Card ── */}
      {!initialData.eligibility.isEligible && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "border rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6",
            initialData.eligibility.reason === 'active_test'
              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40"
              : "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40"
          )}
        >
          <div className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm",
            initialData.eligibility.reason === 'active_test'
              ? "bg-white dark:bg-orange-900/40"
              : "bg-white dark:bg-indigo-900/40"
          )}>
            <Clock className={cn(
              "w-8 h-8",
              initialData.eligibility.reason === 'active_test' ? "text-orange-600" : "text-indigo-600"
            )} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className={cn(
              "font-bold text-lg",
              initialData.eligibility.reason === 'active_test' ? "text-orange-950 dark:text-orange-100" : "text-indigo-950 dark:text-indigo-100"
            )}>
              {initialData.eligibility.reason === 'active_test' 
                ? t("activeTestError") 
                : t("cooldownTitle") || "Take a break!"}
            </h3>
            <p className={cn(
              "text-sm mt-1",
              initialData.eligibility.reason === 'active_test' 
                ? "text-orange-900/60 dark:text-orange-300/60" 
                : "text-indigo-900/60 dark:text-indigo-300/60"
            )}>
              {initialData.eligibility.reason === 'active_test'
                ? t("activeTestDesc")
                : t("cooldownDesc", { 
                    date: initialData.eligibility.nextEligibleDate ? format.dateTime(new Date(initialData.eligibility.nextEligibleDate!), { dateStyle: 'long' }) : ""
                  })}
            </p>
          </div>
          {initialData.eligibility.reason === 'cooldown' && initialData.eligibility.nextEligibleDate && (
            <Badge variant="secondary" className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-4 py-1.5 rounded-md border-none font-bold">
              {format.dateTime(new Date(initialData.eligibility.nextEligibleDate!), { day: '2-digit', month: 'short' })}
            </Badge>
          )}
        </motion.div>
      )}

      {/* ── Active / Resume ── */}
      {initialData.activeTests.length > 0 && (
        <section>
          <SectionLabel icon={<Clock className="w-3.5 h-3.5" />}>
            {t("continueTesting") || "Continue Testing"}
          </SectionLabel>

          <div className="grid gap-3">
            {initialData.activeTests.map((test, i) => (
              <motion.div key={test.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-orange-200 dark:border-orange-900/40 bg-orange-50/40 dark:bg-orange-950/10 px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center font-bold text-orange-600 dark:text-orange-400 text-sm">
                      {test.language?.code?.toUpperCase()?.substring(0, 2) || "??"}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{test.language?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("startedOn") || "Started"} {test.startedAt ? format.dateTime(new Date(test.startedAt), { dateStyle: 'medium' }) : "--"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[10px] h-5 border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400">
                      {t("inProgress") || "In Progress"}
                    </Badge>
                    <Button
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white h-8 px-4 text-xs"
                      onClick={() => router.push(`/hub/student/placement/test?languageId=${test.languageId}`)}
                    >
                      <Play className="w-3 h-3 mr-1.5 fill-current" />
                      {t("resumeTest") || "Resume"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* ── Available Languages ── */}
      <section>
        <SectionLabel icon={<Languages className="w-3.5 h-3.5" />}>
          {t("newPlacement") || "New Placement Test"}
        </SectionLabel>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {initialData.availableLanguages.map((lang, i) => (
            <motion.div key={lang.id} variants={fadeUp} initial="hidden" animate="show" custom={i}>
              <button
                disabled={!initialData.eligibility.isEligible}
                className={cn(
                  "group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-border bg-white dark:bg-gray-900 transition-all duration-200",
                  initialData.eligibility.isEligible 
                    ? "hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm" 
                    : "opacity-60 grayscale cursor-not-allowed"
                )}
                onClick={() => handleStartTest(lang.id)}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold">{lang.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("startEvaluation") || "Start Evaluation"}</p>
                </div>
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <Play className="w-3 h-3 text-indigo-600 dark:text-indigo-400 fill-current" />
                </div>
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── History ── */}
      <section>
        <SectionLabel icon={<Trophy className="w-3.5 h-3.5" />}>
          {t("history") || "My Results"}
        </SectionLabel>

        {completedHistory.length > 0 ? (
          <div className="rounded-2xl border border-border bg-white dark:bg-gray-900 overflow-hidden divide-y divide-border">
            {completedHistory.map((test, i) => {
              const cefr = test.finalEloScore ? mapEloToCEFR(test.finalEloScore) : "N/A";
              const isLoading = isLoadingResult && loadingId === test.id;

              return (
                <motion.button
                  key={test.id}
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  custom={i}
                  disabled={isLoadingResult}
                  onClick={() => !isLoadingResult && handleViewResult(test.id)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40 transition-colors disabled:opacity-50 text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-md bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        test.language?.code?.toUpperCase()?.substring(0, 2) || "??"
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{test.language?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(test.completedAt || test.startedAt) 
                          ? format.dateTime(new Date((test.completedAt || test.startedAt)!), { dateStyle: 'medium' }) 
                          : "--"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-0.5">
                        Level
                      </p>
                      <p className={cn(
                        "text-2xl font-black leading-none",
                        cefr === "N/A" ? "text-muted-foreground" : "text-indigo-600 dark:text-indigo-400"
                      )}>
                        {cefr}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/10">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-semibold">{t("noHistory") || "No history yet"}</p>
            <p className="text-xs text-muted-foreground mt-1 text-center max-w-xs">
              {t("noHistoryDesc") || "Complete a placement test to see your results here."}
            </p>
          </div>
        )}
      </section>

      {/* ── Result Vault ── */}
      <Vault open={!!selectedTestResult} onOpenChange={(open) => !open && setSelectedTestResult(null)}>
        <VaultContent className="max-w-2xl">
          {selectedTestResult && (
            <>
              <VaultHeader>
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-950/50 rounded-md flex items-center justify-center font-bold text-indigo-600 uppercase text-sm">
                    {selectedTestResult.level?.substring(0, 2)}
                  </div>
                  <div>
                    <VaultTitle>{t("placementResult") || "Placement Result"}</VaultTitle>
                    <VaultDescription>
                      {t("completedOn") || "Completed on"}{" "}
                      {selectedTestResult.completedAt ? format.dateTime(new Date(selectedTestResult.completedAt), { dateStyle: 'full' }) : "--"}
                    </VaultDescription>
                  </div>
                </div>
              </VaultHeader>
              <div className="overflow-y-auto max-h-[70vh]">
                <ResultView
                  hideButtons
                  result={selectedTestResult}
                />
              </div>
            </>
          )}
        </VaultContent>
      </Vault>
        </div>
      </main>

      <StudentHelpWizard
        page="placement"
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onComplete={handleCompleteHelp}
      />
    </div>
  );
}