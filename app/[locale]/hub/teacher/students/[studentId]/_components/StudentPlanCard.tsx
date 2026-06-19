"use client";

import { useState, useMemo, useTransition, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Target,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Edit,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Search,
  Loader2,
  GraduationCap,
  ListOrdered,
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
import { StudentRoadmap } from "@/modules/learning/learning.types";
import { notify } from "@/components/ui/toaster";
import {
  getTemplatesAction,
  assignPlanAction,
  reorderLessonsAction,
  removeLessonFromPlanAction,
  addLessonToPlanAction,
} from "@/modules/learning/learning.actions";
import { getLessonsAction } from "@/modules/curriculum/curriculum.actions";
import type { LessonSummary } from "@/modules/curriculum/curriculum.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlanTemplateLessonEntry {
  planId: string;
  lessonId: string;
  order: number;
  isCompleted: boolean;
  scheduledDate: Date | null;
}

interface PlanTemplate {
  id: string;
  name: string;
  description: string | null;
  languageId: string;
  language?: { name: string } | null;
  lessons: PlanTemplateLessonEntry[];
}

interface StudentPlanCardProps {
  studentId: string;
  initialData: StudentRoadmap | null;
  isVaultMode?: boolean;
}

// ─── Difficulty badge colors ───────────────────────────────────────────────────
const DIFFICULTY_COLORS: Record<string, string> = {
  A1: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  A2: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  B1: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  B2: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  C1: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  C2: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

// ─── Sub-vault: Add Lesson from Catalog ──────────────────────────────────────

interface AddLessonVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  languageId: string;
  existingLessonIds: string[];
  onAdded: () => void;
}

function AddLessonVault({
  open,
  onOpenChange,
  planId,
  languageId,
  existingLessonIds,
  onAdded,
}: AddLessonVaultProps) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [addingId, setAddingId] = useState<string | null>(null);

  const { data, isLoading } = useSWR(
    open ? ["catalog-lessons", languageId, search] : null,
    () => getLessonsAction({ languageId, search, limit: 50, status: "ready" })
  );

  const lessons = (data?.data ?? []) as LessonSummary[];

  const handleAdd = useCallback(
    (lessonId: string) => {
      startTransition(async () => {
        setAddingId(lessonId);
        const result = await addLessonToPlanAction({ planId, lessonId });
        if (result?.data?.success) {
          notify.success("Lição adicionada ao plano!");
          onAdded();
        } else {
          notify.error(result?.serverError ?? "Erro ao adicionar lição.");
        }
        setAddingId(null);
      });
    },
    [planId, onAdded]
  );

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-xl max-h-[85vh]">
        <VaultHeader>
          <VaultTitle>Adicionar Lição ao Plano</VaultTitle>
          <VaultDescription>
            Pesquise e adicione lições do currículo ao plano de estudos.
          </VaultDescription>
        </VaultHeader>
        <VaultBody>
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar lições..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* List */}
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[55vh] no-scrollbar">
              {isLoading ? (
                <div className="flex flex-col gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="item flex items-center justify-between p-3 animate-pulse"
                    >
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/4" />
                      </div>
                      <div className="h-8 w-8 bg-muted rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : lessons.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma lição encontrada.</p>
                </div>
              ) : (
                lessons.map((lesson) => {
                  const alreadyAdded = existingLessonIds.includes(lesson.id);
                  const isAdding = addingId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        "item flex items-center justify-between p-3 gap-3",
                        alreadyAdded && "opacity-50 pointer-events-none"
                      )}
                    >
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {lesson.title}
                        </span>
                        {lesson.difficulty && (
                          <span
                            className={cn(
                              "inline-flex self-start text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              DIFFICULTY_COLORS[lesson.difficulty] ??
                                "bg-gray-100 text-gray-600"
                            )}
                          >
                            {lesson.difficulty}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={alreadyAdded || isPending}
                        onClick={() => handleAdd(lesson.id)}
                        className="shrink-0 h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : alreadyAdded ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}

// ─── Sub-vault: Assign Template ───────────────────────────────────────────────

interface AssignTemplateVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  onAssigned: () => void;
}

function AssignTemplateVault({
  open,
  onOpenChange,
  studentId,
  onAssigned,
}: AssignTemplateVaultProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { data, isLoading } = useSWR(
    open ? "plan-templates" : null,
    () => getTemplatesAction({})
  );

  const templates = ((data?.data?.success ? data.data.data : null) ??
    []) as PlanTemplate[];

  const handleAssign = () => {
    if (!selectedId) return;
    startTransition(async () => {
      const result = await assignPlanAction({
        templateId: selectedId,
        studentId,
      });
      if (result?.data?.success) {
        notify.success("Plano atribuído com sucesso!");
        onAssigned();
        onOpenChange(false);
      } else {
        notify.error(result?.serverError ?? "Erro ao atribuir o plano.");
      }
    });
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-lg max-h-[85vh]">
        <VaultHeader>
          <VaultTitle>Selecionar Plano</VaultTitle>
          <VaultDescription>
            Escolha um template de plano de estudos para atribuir ao aluno.
          </VaultDescription>
        </VaultHeader>
        <VaultBody>
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[55vh] no-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="item flex flex-col gap-2 p-4 animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum template disponível.</p>
              </div>
            ) : (
              templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedId(tpl.id)}
                  className={cn(
                    "item text-left flex flex-col gap-1 p-4 transition-all",
                    selectedId === tpl.id &&
                      "border-primary/40 bg-primary/5 dark:bg-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm truncate">
                      {tpl.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {tpl.language && (
                        <Badge
                          variant="outline"
                          className="text-[10px] rounded-full"
                        >
                          {tpl.language.name}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] rounded-full"
                      >
                        {tpl.lessons.length} lições
                      </Badge>
                    </div>
                  </div>
                  {tpl.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {tpl.description}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </VaultBody>
        <VaultFooter>
          <VaultPrimaryButton
            onClick={handleAssign}
            disabled={!selectedId || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Atribuindo...
              </>
            ) : (
              "Atribuir Plano"
            )}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}

// ─── Sub-vault: Edit Plan Lessons ────────────────────────────────────────────

interface EditPlanVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  languageId: string;
  initialLessons: StudentRoadmap["lessons"];
  onSaved: () => void;
}

function EditPlanVault({
  open,
  onOpenChange,
  planId,
  languageId,
  initialLessons,
  onSaved,
}: EditPlanVaultProps) {
  const [lessons, setLessons] = useState(
    [...initialLessons].sort((a, b) => a.order - b.order)
  );
  const [isPending, startTransition] = useTransition();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Reset state when vault opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLessons([...initialLessons].sort((a, b) => a.order - b.order));
      setIsDirty(false);
    }
    onOpenChange(newOpen);
  };

  const move = (index: number, direction: "up" | "down") => {
    const newLessons = [...lessons];
    const target = direction === "up" ? index - 1 : index + 1;
    [newLessons[index], newLessons[target]] = [
      newLessons[target],
      newLessons[index],
    ];
    setLessons(newLessons);
    setIsDirty(true);
  };

  const remove = (lessonId: string) => {
    startTransition(async () => {
      const result = await removeLessonFromPlanAction({ planId, lessonId });
      if (result?.data?.success) {
        setLessons((prev) => prev.filter((l) => l.id !== lessonId));
        notify.success("Lição removida do plano.");
        onSaved();
      } else {
        notify.error(result?.serverError ?? "Erro ao remover lição.");
      }
    });
  };

  const saveOrder = () => {
    startTransition(async () => {
      const lessonIds = lessons.map((l) => l.id);
      const result = await reorderLessonsAction({ planId, lessonIds });
      if (result?.data?.success) {
        notify.success("Ordem das lições salva!");
        setIsDirty(false);
        onSaved();
      } else {
        notify.error(result?.serverError ?? "Erro ao salvar a ordem.");
      }
    });
  };

  const handleLessonAdded = () => {
    onSaved();
    // Refresh the local lesson list from parent after server revalidates
    onOpenChange(false);
  };

  return (
    <>
      <Vault open={open} onOpenChange={handleOpenChange}>
        <VaultContent className="max-w-2xl max-h-[90vh]">
          <VaultHeader>
            <VaultTitle>Editar Sequência de Lições</VaultTitle>
            <VaultDescription>
              Reordene ou remova lições do plano. Adicione novas do currículo.
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] no-scrollbar">
              {lessons.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <ListOrdered className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Este plano não possui lições.</p>
                  <p className="text-xs mt-1">
                    Use o botão abaixo para adicionar do currículo.
                  </p>
                </div>
              ) : (
                lessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className="item flex items-center gap-3 p-3"
                  >
                    {/* Order indicator */}
                    <span className="shrink-0 w-6 text-center text-xs font-bold text-muted-foreground">
                      {index + 1}
                    </span>

                    {/* Lesson info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {lesson.title}
                      </p>
                      {lesson.isDraft && (
                        <Badge className="h-4 text-[9px] uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold px-1.5 mt-0.5">
                          Rascunho
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0 || isPending}
                        onClick={() => move(index, "up")}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Mover para cima"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={index === lessons.length - 1 || isPending}
                        onClick={() => move(index, "down")}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Mover para baixo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => remove(lesson.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Remover lição"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </VaultBody>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsAddOpen(true)}>
              Adicionar Lição
            </VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={saveOrder}
              disabled={!isDirty || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Ordem"
              )}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>

      {/* Nested Add Lesson Vault */}
      <AddLessonVault
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        planId={planId}
        languageId={languageId}
        existingLessonIds={lessons.map((l) => l.id)}
        onAdded={handleLessonAdded}
      />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StudentPlanCard({
  studentId,
  initialData,
  isVaultMode = false,
}: StudentPlanCardProps) {
  const t = useTranslations("PlanCard");
  const tMonths = useTranslations("Months");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [isVaultOpen, setIsVaultOpen] = useState(false);

  const monthNames = [
    tMonths("january"),
    tMonths("february"),
    tMonths("march"),
    tMonths("april"),
    tMonths("may"),
    tMonths("june"),
    tMonths("july"),
    tMonths("august"),
    tMonths("september"),
    tMonths("october"),
    tMonths("november"),
    tMonths("december"),
  ];

  const filteredLessons = useMemo(() => {
    if (!initialData) return [];
    return initialData.lessons.filter((lesson) => {
      const matchesSearch = lesson.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!lesson.scheduledDate) return matchesSearch;
      const lessonDate = new Date(lesson.scheduledDate);
      const matchesDate =
        lessonDate.getMonth() === selectedMonth &&
        lessonDate.getFullYear() === selectedYear;
      return matchesSearch && matchesDate;
    });
  }, [initialData, searchQuery, selectedMonth, selectedYear]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "current":
        return <Clock className="h-4 w-4 text-primary animate-pulse" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground/30" />;
    }
  };

  const handleMutated = () => {
    router.refresh();
    setIsVaultOpen(false);
  };

  // ── No active plan ──────────────────────────────────────────────────────────
  if (!initialData) {
    return (
      <div
        className={cn(
          !isVaultMode && "card",
          "flex flex-col h-full sm:p-4 p-2 items-center justify-center text-center space-y-4"
        )}
      >
        <Target className="h-12 w-12 text-muted-foreground/20" />
        <div className="space-y-2">
          <h3 className="font-bold text-muted-foreground">
            {t("noPlanTitle") || "Sem Plano Ativo"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            {t("noPlanDescription") ||
              "Este aluno ainda não possui um plano de estudos vinculado."}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVaultOpen(true)}
        >
          {t("createPlan") || "Criar Plano"}
        </Button>

        <AssignTemplateVault
          open={isVaultOpen}
          onOpenChange={setIsVaultOpen}
          studentId={studentId}
          onAssigned={() => router.refresh()}
        />
      </div>
    );
  }

  // ── Has active plan ─────────────────────────────────────────────────────────
  return (
    <>
      <div
        className={cn(
          !isVaultMode && "card",
          "flex flex-col h-full sm:p-4 p-2"
        )}
      >
        {/* Header Sticky */}
        <div
          className={cn(
            "pb-6 sticky top-0 z-10 bg-transparent",
            isVaultMode && "pt-1"
          )}
        >
          {!isVaultMode && (
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {t("title") || "Plano de Estudos"}
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full bg-primary/5 text-primary border-primary/10 mr-2"
                  >
                    {initialData.progress}%
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
                  {initialData.name}
                </h3>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${initialData.progress}%` }}
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
                  withSearch:
                    t("noResultsSearch", { query: searchQuery }) ||
                    `Nenhuma lição para "${searchQuery}" neste período`,
                  withoutSearch:
                    t("noResults") || "Nenhuma lição para este mês",
                }}
              />
            ) : (
              filteredLessons
                .sort((a, b) =>
                  a.scheduledDate && b.scheduledDate
                    ? new Date(a.scheduledDate).getTime() -
                      new Date(b.scheduledDate).getTime()
                    : a.order - b.order
                )
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className={cn(
                      "item flex flex-col p-3 group transition-all gap-1",
                      lesson.status === "current" &&
                        "border-primary/30 bg-primary/5 dark:bg-primary/10"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0">{getStatusIcon(lesson.status)}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4
                              className={cn(
                                "text-sm font-medium truncate transition-colors",
                                lesson.status === "completed" &&
                                  "text-muted-foreground line-through opacity-70",
                                lesson.status === "current" &&
                                  "text-primary font-bold"
                              )}
                            >
                              {t("lesson", {
                                order: lesson.order,
                                title: lesson.title,
                              })}
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
                          {format(new Date(lesson.scheduledDate), "dd 'de' MMM", {
                            locale: dateLocale,
                          })}
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

      {/* Edit Plan Vault */}
      <EditPlanVault
        open={isVaultOpen}
        onOpenChange={setIsVaultOpen}
        planId={initialData.id}
        languageId={initialData.languageId}
        initialLessons={initialData.lessons}
        onSaved={handleMutated}
      />
    </>
  );
}
