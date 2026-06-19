"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { getStudentLessonsAction } from "@/modules/learning/learning.actions";
import { useTiptapEditor } from "@/hooks/use-tiptap-editor";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  PlusCircle,
  GraduationCap,
  X,
  Calendar,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import type { JSONContent } from "@tiptap/core";

interface EnrichedLesson {
  id: string;
  title: string;
  contentJson?: JSONContent | null;
  scheduledDate?: Date;
}

interface EnrichedPlan {
  id: string;
  name: string;
  lessons: EnrichedLesson[];
}

interface StudentLessonsData {
  activePlan: EnrichedPlan | null;
  classLessons: EnrichedLesson[];
}

interface NotebookPlansVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
}

export function NotebookPlansVault({ open, onOpenChange, studentId }: NotebookPlansVaultProps) {
  const t = useTranslations("Learning");
  const { editor } = useTiptapEditor();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAccordion, setActiveAccordion] = useState<string[]>(["active-plan"]);

  const { data: result, isLoading } = useSWR(
    open && studentId ? ["student-lessons", studentId] : null,
    () => getStudentLessonsAction({ studentId })
  );

  const studentData = (result?.data?.success ? result.data.data : null) as StudentLessonsData | null;

  const filteredActivePlan = useMemo<EnrichedPlan | null>(() => {
    if (!studentData?.activePlan) return null;
    if (!searchQuery) return studentData.activePlan;

    const lower = searchQuery.toLowerCase();
    const matching = studentData.activePlan.lessons.filter((l) =>
      (l.title || "").toLowerCase().includes(lower)
    );

    return {
      ...studentData.activePlan,
      lessons: matching,
    };
  }, [studentData, searchQuery]);

  const filteredClassLessons = useMemo<EnrichedLesson[]>(() => {
    if (!studentData?.classLessons) return [];
    if (!searchQuery) return studentData.classLessons;

    const lower = searchQuery.toLowerCase();
    return studentData.classLessons.filter((l) =>
      (l.title || "").toLowerCase().includes(lower)
    );
  }, [studentData, searchQuery]);

  const hasResults = useMemo(() => {
    const hasActiveLessons = filteredActivePlan ? filteredActivePlan.lessons.length > 0 : false;
    const hasClassLessons = filteredClassLessons.length > 0;
    return hasActiveLessons || hasClassLessons;
  }, [filteredActivePlan, filteredClassLessons]);

  const handleInsertContent = (lesson: EnrichedLesson) => {
    if (!lesson.contentJson) {
      toast.error(t("lesson_no_content") || "Lição sem conteúdo.");
      return;
    }
    if (!editor) {
      toast.error(t("editor_not_ready") || "Editor não inicializado.");
      return;
    }
    try {
      editor.commands.insertContent(lesson.contentJson);
      toast.success(t("content_inserted") || "Conteúdo inserido com sucesso!");
      onOpenChange(false);
    } catch (error) {
      console.error("[NotebookPlansVault] Insert Error:", error);
      toast.error(t("insert_error") || "Erro ao inserir conteúdo.");
    }
  };

  const renderSkeletons = () => (
    <div className="space-y-4 px-1 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="border rounded-xl p-4 space-y-3">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        {/* HEADER */}
        <VaultHeader className="px-6 py-4 border-b">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {t("student_plans") || "Biblioteca de Planos do Aluno"}
            </div>
            <VaultTitle className="text-xl font-bold tracking-tight text-left">
              {t("select_lesson") || "Inserir Conteúdo de Lições"}
            </VaultTitle>
            <VaultDescription className="text-left text-xs">
              {t("select_lesson_desc") || "Selecione uma lição do plano ativo ou de aulas passadas para inserir no caderno."}
            </VaultDescription>
          </div>
        </VaultHeader>

        {/* SEARCH BAR */}
        <div className="px-6 py-3 border-b bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search_lessons") || "Buscar lição em todos os planos..."}
              className="pl-9 pr-9 bg-background h-10 border-muted"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* CONTENT AREA */}
        <VaultBody className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-[45vh] w-full px-6 py-4">
            {isLoading ? (
              renderSkeletons()
            ) : !hasResults ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="bg-muted rounded-full p-4 mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">
                  {t("no_lessons_found") || "Nenhuma lição encontrada"}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs mt-1 font-normal">
                  {searchQuery
                    ? (t("search_no_results") || "Nenhuma lição corresponde à sua busca.")
                    : (t("student_no_plans") || "Este aluno não possui lições ou planos de estudo cadastrados.")}
                </p>
              </div>
            ) : (
              <Accordion
                value={activeAccordion}
                onValueChange={setActiveAccordion}
                className="space-y-4"
              >
                {/* PLANO ATIVO */}
                {filteredActivePlan && filteredActivePlan.lessons.length > 0 && (
                  <AccordionItem
                    value="active-plan"
                    className="border rounded-xl bg-background overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/10 px-4 py-3">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {filteredActivePlan.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="default" className="text-[10px] px-1.5 py-0 font-bold bg-emerald-600 hover:bg-emerald-600 text-white border-0 rounded">
                              {t("active_plan") || "Plano Ativo"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-normal">
                              {filteredActivePlan.lessons.length} {t("lessons") || "lições"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 px-4 border-t border-muted/30">
                      <div className="flex flex-col space-y-1">
                        {filteredActivePlan.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="item flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group border border-transparent"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-1.5 bg-primary/10 text-primary rounded shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="font-semibold text-sm text-foreground truncate"
                                  title={lesson.title}
                                >
                                  {lesson.title || "Lição Sem Título"}
                                </span>
                                {lesson.scheduledDate && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-0.5 font-normal">
                                    <Calendar className="w-3 h-3 mr-1 shrink-0" />
                                    {new Date(lesson.scheduledDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleInsertContent(lesson)}
                            >
                              <PlusCircle className="w-5 h-5 text-primary" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* OUTRAS LIÇÕES (AULAS AGENDADAS) */}
                {filteredClassLessons.length > 0 && (
                  <AccordionItem
                    value="class-lessons"
                    className="border rounded-xl bg-background overflow-hidden"
                  >
                    <AccordionTrigger className="hover:no-underline hover:bg-muted/10 px-4 py-3">
                      <div className="flex items-center gap-3 w-full text-left">
                        <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-foreground">
                            {t("other_class_lessons") || "Lições de Aulas Agendadas"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold bg-muted text-muted-foreground border-0 rounded">
                              {t("outside_plan") || "Fora do Plano"}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-normal">
                              {filteredClassLessons.length} {t("lessons") || "lições"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-3 px-4 border-t border-muted/30">
                      <div className="flex flex-col space-y-1">
                        {filteredClassLessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="item flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors group border border-transparent"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-1.5 bg-primary/10 text-primary rounded shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span
                                  className="font-semibold text-sm text-foreground truncate"
                                  title={lesson.title}
                                >
                                  {lesson.title || "Lição Sem Título"}
                                </span>
                                {lesson.scheduledDate && (
                                  <div className="flex items-center text-xs text-muted-foreground mt-0.5 font-normal">
                                    <Calendar className="w-3 h-3 mr-1 shrink-0" />
                                    {new Date(lesson.scheduledDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleInsertContent(lesson)}
                            >
                              <PlusCircle className="w-5 h-5 text-primary" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}
          </ScrollArea>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
