"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { FileText, BookOpen, PlusCircle, Loader2, GraduationCap } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LessonContentView } from "@/components/lesson/lesson-content-view";
import {
  getCatalogLessonPreviewAction,
  addCatalogLessonToStudentPlanAction,
} from "@/modules/learning/learning.actions";

export interface CatalogLesson {
  id: string;
  title: string;
  difficulty: string;
}

interface NotebookCatalogLessonsProps {
  lessons: CatalogLesson[];
  isLoading: boolean;
  studentId: string;
  onAdded: () => void;
}

function CatalogLessonPreview({ lessonId }: { lessonId: string }) {
  const t = useTranslations("Learning");
  const { data, isLoading } = useSWR(["catalog-lesson-preview", lessonId], () =>
    getCatalogLessonPreviewAction({ lessonId })
  );

  const lesson = data?.data?.success ? data.data.data : null;
  const content = (lesson?.contentJson ?? null) as JSONContent | null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("lesson_no_content")}
      </p>
    );
  }

  return (
    <div className="max-h-[40vh] overflow-y-auto rounded-lg border">
      <LessonContentView content={content} />
    </div>
  );
}

export function NotebookCatalogLessons({
  lessons,
  isLoading,
  studentId,
  onAdded,
}: NotebookCatalogLessonsProps) {
  const t = useTranslations("Learning");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [lessonToAdd, setLessonToAdd] = useState<CatalogLesson | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const confirmAdd = async () => {
    if (!lessonToAdd) return;
    setIsAdding(true);
    try {
      const result = await addCatalogLessonToStudentPlanAction({
        studentId,
        lessonId: lessonToAdd.id,
      });
      const payload = result?.data;
      if (!payload?.success || !payload.data) {
        toast.error(t("catalog_add_error"));
        return;
      }
      if (payload.data.alreadyInPlan) {
        toast.info(t("catalog_already_in_plan"));
      } else if (payload.data.createdPlan) {
        toast.success(t("catalog_plan_created"));
      } else {
        toast.success(t("catalog_added"));
      }
      setLessonToAdd(null);
      onAdded();
    } catch (error) {
      console.error("[NotebookCatalogLessons] Add error:", error);
      toast.error(t("catalog_add_error"));
    } finally {
      setIsAdding(false);
    }
  };

  if (isLoading && lessons.length === 0) {
    return (
      <div className="space-y-2 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-muted rounded-full p-4 mb-4">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-bold">{t("no_lessons_found")}</h3>
        <p className="text-muted-foreground text-sm max-w-xs mt-1 font-normal">
          {t("catalog_no_results")}
        </p>
      </div>
    );
  }

  return (
    <>
      <Accordion value={expanded} onValueChange={setExpanded} className="space-y-1">
        {lessons.map((lesson) => (
          <AccordionItem
            key={lesson.id}
            value={lesson.id}
            className="border rounded-lg bg-background overflow-hidden"
          >
            <AccordionTrigger className="hover:no-underline hover:bg-muted/30 px-3 py-3 items-center">
              <div className="flex items-center justify-between gap-3 w-full min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 bg-primary/10 text-primary rounded shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className="font-semibold text-sm text-foreground truncate"
                    title={lesson.title}
                  >
                    {lesson.title}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0 text-[10px] font-bold">
                  {lesson.difficulty}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-3 border-t border-muted/30">
              <div className="space-y-3 py-3">
                <CatalogLessonPreview lessonId={lesson.id} />
                <Button className="w-full" onClick={() => setLessonToAdd(lesson)}>
                  <PlusCircle className="w-4 h-4" />
                  {t("catalog_add_button")}
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {lessonToAdd && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalog-confirm-title"
        >
          <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-5 w-5" />
            </div>
            <h2 id="catalog-confirm-title" className="text-lg font-bold">
              {t("catalog_confirm_title")}
            </h2>
            <p className="mt-1 text-sm font-semibold">{lessonToAdd.title}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t("catalog_confirm_desc")}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" disabled={isAdding} onClick={() => setLessonToAdd(null)}>
                {t("catalog_cancel")}
              </Button>
              <Button disabled={isAdding} onClick={confirmAdd}>
                {isAdding && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("catalog_confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
