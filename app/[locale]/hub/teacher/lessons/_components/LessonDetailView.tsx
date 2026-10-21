"use client";

import { LessonWithDetails, type QuizData } from "@/modules/curriculum/curriculum.types";
import { AudioLines, BookOpen, CheckCircle2, Coffee, Globe, ListChecks, HelpCircle, GraduationCap } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Header } from "@/components/layout/header";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type JSONContent } from "@tiptap/core";
import { cn } from "@/lib/utils";
import { levelBadgeClass } from "./level-style";

interface LessonDetailViewProps {
  lesson: LessonWithDetails;
}

function SectionLabel({ icon: Icon, children }: { icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export function LessonDetailView({ lesson }: LessonDetailViewProps) {
  const t = useTranslations("LessonDetail");
  const params = useParams();
  const locale = params.locale as string;

  const vocabulary = lesson.items?.filter((i) => i.item.type === "VOCABULARY") || [];
  const structures = lesson.items?.filter((i) => i.item.type === "STRUCTURE") || [];
  const quiz = lesson.quizData as QuizData | null;
  const questions = quiz?.questions ?? quiz?.quiz_sections?.flatMap((s) => s.questions) ?? [];
  const contentJson = lesson.contentJson as JSONContent | null;

  const ContentSection = (
    <div className="space-y-6">
      {lesson.media?.url && (
        <div className="space-y-3">
          <SectionLabel icon={AudioLines}>{t("audioTitle")}</SectionLabel>
          <AudioPlayer url={lesson.media.url} title={t("audioPlayerTitle")} className="card" />
        </div>
      )}

      <article className="card p-4 md:p-8">
        {contentJson && lesson.contentText && (
          <p className="mb-6 rounded-md border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm font-medium leading-relaxed text-foreground/85">
            {lesson.contentText}
          </p>
        )}
        {contentJson ? (
          <div className="lesson-content -mx-4">
            <RichTextEditor content={contentJson} onChange={() => {}} editable={false} />
          </div>
        ) : lesson.contentText ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{lesson.contentText}</p>
        ) : (
          <p className="py-12 text-center italic text-muted-foreground">{t("noContent")}</p>
        )}
      </article>
    </div>
  );

  const OverviewCard = (
    <div className="card space-y-3 p-4">
      <SectionLabel icon={GraduationCap}>{t("overviewTitle")}</SectionLabel>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t("levelLabel")}</dt>
          <dd>
            <span className={cn("inline-flex h-6 items-center rounded-md px-2 text-xs font-bold ring-1 ring-inset", levelBadgeClass(lesson.difficulty))}>
              {lesson.difficulty}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t("languageLabel")}</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {lesson.language?.name}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t("typeLabel")}</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            {lesson.isRecessActivity ? <Coffee className="h-3.5 w-3.5 text-amber-500" /> : <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />}
            {lesson.isRecessActivity ? t("typeRecess") : t("typeRegular")}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-muted-foreground">{t("questionsLabel")}</dt>
          <dd className="font-semibold">{questions.length}</dd>
        </div>
      </dl>
    </div>
  );

  const QuizSection = (
    <div className="card space-y-4 p-4">
      <div className="space-y-1">
        <SectionLabel icon={HelpCircle}>{t("quizTitle")}</SectionLabel>
        {questions.length > 0 && <p className="text-xs text-muted-foreground">{t("quizSubtitle", { count: questions.length })}</p>}
      </div>
      {questions.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">{t("noQuiz")}</p>
      ) : (
        <ol className="space-y-4">
          {questions.map((q, idx) => {
            const correct = q.correctAnswer ?? (q.correctIndex !== undefined ? q.options[q.correctIndex] : undefined);
            return (
              <li key={q.id ?? idx} className="space-y-2">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  <span className="mr-1.5 text-primary">{idx + 1}.</span>
                  {q.text}
                </p>
                <ul className="space-y-1">
                  {q.options.map((option) => {
                    const isCorrect = option === correct;
                    return (
                      <li
                        key={option}
                        className={cn(
                          "flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs",
                          isCorrect
                            ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300"
                            : "text-foreground/70"
                        )}
                      >
                        {isCorrect ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                        {option}
                      </li>
                    );
                  })}
                </ul>
                {q.explanation && <p className="pl-2.5 text-[11px] leading-relaxed text-muted-foreground">{q.explanation}</p>}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );

  const ItemsSection = (vocabulary.length > 0 || structures.length > 0) && (
    <div className="card space-y-4 p-4">
      <SectionLabel icon={ListChecks}>{t("learningItemsTitle")}</SectionLabel>
      {vocabulary.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">{t("vocabularyTitle")}</h4>
          <div className="grid gap-1.5">
            {vocabulary.map((li, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                <span className="text-sm font-semibold">{li.item.lemma}</span>
                <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {structures.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary">{t("structuresTitle")}</h4>
          <div className="grid gap-1.5">
            {structures.map((li, idx) => (
              <div key={idx} className="flex flex-col gap-0.5 rounded-md bg-muted/40 px-3 py-2">
                <span className="text-sm font-semibold">{li.item.lemma}</span>
                <span className="text-xs text-muted-foreground">{(li.item.metadata as { translation?: string }).translation}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Sidebar = (
    <div className="space-y-4">
      {OverviewCard}
      {QuizSection}
      {ItemsSection}
    </div>
  );

  return (
    <div>
      <Header title={lesson.title} showSubHeader={false} className="contents" backHref={`/${locale}/hub/teacher/lessons`} />

      <div className="container">
        {/* Desktop */}
        <div className="hidden items-start gap-6 lg:grid lg:grid-cols-3">
          <div className="col-span-2" data-tour="teacher-lesson.content">
            {ContentSection}
          </div>
          <aside className="sticky top-4" data-tour="teacher-lesson.items">
            {Sidebar}
          </aside>
        </div>

        {/* Mobile / tablet */}
        <div className="lg:hidden" data-tour="teacher-lesson.content">
          <div className="mb-4">{OverviewCard}</div>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="mb-4 grid h-11 w-full grid-cols-2 rounded-md bg-muted/50 p-1" data-tour="teacher-lesson.items">
              <TabsTrigger value="content" className="rounded-md data-[state=active]:bg-background">
                {t("tabContent")}
              </TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-md data-[state=active]:bg-background">
                {t("tabQuiz")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="mt-0 focus-visible:outline-none">
              {ContentSection}
            </TabsContent>
            <TabsContent value="quiz" className="mt-0 space-y-4 focus-visible:outline-none">
              {QuizSection}
              {ItemsSection}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
