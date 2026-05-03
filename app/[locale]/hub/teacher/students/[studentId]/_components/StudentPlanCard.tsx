"use client";

import { useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Target,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Edit,
} from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";

interface Lesson {
  id: string;
  title: string;
  status: "completed" | "pending" | "current";
  order: number;
  scheduledDate?: string;
  isDraft?: boolean;
  goal?: string;
}

interface StudentPlanCardProps {
  studentId: string;
  isVaultMode?: boolean;
}

export function StudentPlanCard({ isVaultMode = false }: StudentPlanCardProps) {
  const t = useTranslations("PlanCard");
  const tMonths = useTranslations("Months");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  // Mock data - will be replaced by server data later
  const [plan] = useState({
    id: "plan-1",
    name: "General English - B1 Intermediate",
    progress: 45,
    lessons: [
      { id: "1", title: "Present Perfect vs Past Simple", status: "completed", order: 1, scheduledDate: new Date(2026, 4, 10).toISOString() },
      { id: "2", title: "Passive Voice Intro", status: "completed", order: 2, scheduledDate: new Date(2026, 4, 15).toISOString() },
      { id: "3", title: "Modal Verbs of Deduction", status: "current", order: 3, scheduledDate: new Date(2026, 4, 20).toISOString(), isDraft: true, goal: "Understand high-probability modals" },
      { id: "4", title: "Conditionals Type 2", status: "pending", order: 4, scheduledDate: new Date(2026, 5, 2).toISOString() },
      { id: "5", title: "Reported Speech Basics", status: "pending", order: 5, scheduledDate: new Date(2026, 5, 10).toISOString() },
      { id: "6", title: "Phrasal Verbs - Travel", status: "pending", order: 6, scheduledDate: new Date(2026, 6, 1).toISOString() },
    ] as Lesson[]
  });

  const monthNames = [
    tMonths("january"), tMonths("february"), tMonths("march"), tMonths("april"),
    tMonths("may"), tMonths("june"), tMonths("july"), tMonths("august"),
    tMonths("september"), tMonths("october"), tMonths("november"), tMonths("december")
  ];

  const filteredLessons = useMemo(() => {
    return plan.lessons.filter(lesson => {
      // Filter by text search
      const matchesSearch = lesson.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by month/year selection
      if (!lesson.scheduledDate) return matchesSearch;
      const lessonDate = new Date(lesson.scheduledDate);
      const matchesDate = lessonDate.getMonth() === selectedMonth &&
        lessonDate.getFullYear() === selectedYear;

      return matchesSearch && matchesDate;
    });
  }, [plan.lessons, searchQuery, selectedMonth, selectedYear]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "current": return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      default: return <Circle className="h-4 w-4 text-muted-foreground/30" />;
    }
  };

  return (
    <>
      <div className={cn(
        !isVaultMode && "card",
        "flex flex-col h-full sm:p-4 p-2"
      )}>
        {/* Header Sticky */}
        <div className={cn(
          "pb-6 sticky top-0 z-10 bg-transparent",
          isVaultMode && "pt-1"
        )}>
          {!isVaultMode && (
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {t("title") || "Plano de Estudos"}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/10 mr-2">
                    {plan.progress}%
                  </Badge>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg"
                    onClick={() => setIsVaultOpen(true)}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-muted-foreground truncate">
                  {plan.name}
                </h3>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Select
                value={selectedMonth.toString()}
                onValueChange={(val) => setSelectedMonth(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - 2 + i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <SearchBar
              placeholder={t("searchPlaceholder") || "Filtrar lições..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-0 pb-4">
          <div className="space-y-2 pr-1">
            {filteredLessons.length === 0 ? (
              <EmptyResults
                searchQuery={searchQuery}
                customMessage={{
                  withSearch: t("noResultsSearch", { query: searchQuery }) || `Nenhuma lição para "${searchQuery}" neste período`,
                  withoutSearch: t("noResults") || "Nenhuma lição para este mês"
                }}
              />
            ) : (
              filteredLessons
                .sort((a, b) => (a.scheduledDate && b.scheduledDate) ? new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime() : a.order - b.order)
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className={cn(
                      "item flex flex-col p-3 group transition-all gap-1",
                      lesson.status === "current" && "border-primary/30 bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">
                          {getStatusIcon(lesson.status)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "text-sm font-medium truncate transition-colors",
                              lesson.status === "completed" && "text-muted-foreground line-through opacity-70",
                              lesson.status === "current" && "text-primary font-bold"
                            )}>
                              {t("lesson", { order: lesson.order, title: lesson.title })}
                            </h4>
                            {lesson.isDraft && (
                              <Badge className="h-4 text-[9px] uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold px-1.5">
                                {t("isDraft") || "Rascunho"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {lesson.scheduledDate && (
                        <span className="text-[10px] font-bold text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {format(new Date(lesson.scheduledDate), "dd 'de' MMM", { locale: dateLocale })}
                        </span>
                      )}
                    </div>
                    {lesson.isDraft && lesson.goal && (
                      <p className="text-[11px] text-muted-foreground italic pl-7 line-clamp-1">
                        {lesson.goal}
                      </p>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      <Vault open={isVaultOpen} onOpenChange={setIsVaultOpen}>
        <VaultContent className="max-w-7xl max-h-[90vh]">
          <VaultHeader>
            <VaultTitle>{plan ? t("editPlan") : t("createPlan")}</VaultTitle>
            <VaultDescription>
              {t("planEditorDescription") || "Gerencie as lições e objetivos do plano de estudos."}
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="p-12 text-center border-2 border-dashed rounded-2xl">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">
                PlanEditor Placeholder - Será implementado posteriormente.
              </p>
            </div>
          </VaultBody>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsVaultOpen(false)}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton onClick={() => setIsVaultOpen(false)}>
              {t("save") || "Salvar Alterações"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </>
  );
}
