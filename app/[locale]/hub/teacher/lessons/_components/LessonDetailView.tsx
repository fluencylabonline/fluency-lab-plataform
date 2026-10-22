"use client";

import { LessonWithDetails, type QuizData, type QuizQuestion } from "@/modules/curriculum/curriculum.types";
import { AudioLines, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, Coffee, Globe, ListChecks, HelpCircle, GraduationCap } from "lucide-react";
import { AudioPlayer } from "@/components/ui/audio-player";
import { Header } from "@/components/layout/header";
import { LessonContentView } from "@/components/lesson/lesson-content-view";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { type JSONContent } from "@tiptap/core";
import { cn } from "@/lib/utils";

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

type SlideQuestion = QuizQuestion & { section?: string };

/** Quiz do professor: uma pergunta por vez, com a resposta certa destacada e a explicação. */
function QuizSlides({ questions }: { questions: SlideQuestion[] }) {
  const [index, setIndex] = useState(0);
  const q = questions[Math.min(index, questions.length - 1)];
  const correct = q.correctAnswer ?? (q.correctIndex !== undefined ? q.options[q.correctIndex] : undefined);
  const last = questions.length - 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {index + 1} / {questions.length}
        </span>
        {q.section && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{q.section}</span>}
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <div className="min-h-[15rem] space-y-3">
        <p className="text-sm font-semibold leading-snug text-foreground">{q.text}</p>
        <ul className="space-y-1.5">
          {q.options.map((option) => {
            const isCorrect = option === correct;
            return (
              <li
                key={option}
                className={cn(
                  "flex items-start gap-2 rounded-md px-2.5 py-2 text-xs",
                  isCorrect ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300" : "bg-muted/40 text-foreground/70"
                )}
              >
                {isCorrect ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />}
                {option}
              </li>
            );
          })}
        </ul>
        {q.explanation && <p className="text-[11px] leading-relaxed text-muted-foreground">{q.explanation}</p>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" className="gap-1" disabled={index === 0} onClick={() => setIndex((i) => Math.max(0, i - 1))}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-1" disabled={index === last} onClick={() => setIndex((i) => Math.min(last, i + 1))}>
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
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
  const questions: SlideQuestion[] =
    quiz?.quiz_sections?.flatMap((s) => s.questions.map((q) => ({ ...q, section: s.type }))) ?? quiz?.questions ?? [];
  const contentJson = lesson.contentJson as JSONContent | null;

  const ContentSection = (
    <div className="flex flex-col gap-4 lg:h-full lg:min-h-0">
      {lesson.media?.url && (
        <div className="space-y-3 lg:shrink-0">
          <SectionLabel icon={AudioLines}>{t("audioTitle")}</SectionLabel>
          <AudioPlayer url={lesson.media.url} title={t("audioPlayerTitle")} className="card" />
        </div>
      )}

      {lesson.isRecessActivity && contentJson && lesson.contentText && (
        <p className="rounded-md border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm font-medium leading-relaxed text-foreground/85 lg:shrink-0">
          {lesson.contentText}
        </p>
      )}
      {contentJson ? (
        <LessonContentView content={contentJson} className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto" />
      ) : lesson.contentText ? (
        <article className="card p-4 md:p-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">{lesson.contentText}</p>
        </article>
      ) : (
        <article className="card p-4 md:p-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <p className="py-12 text-center italic text-muted-foreground">{t("noContent")}</p>
        </article>
      )}
    </div>
  );

  const OverviewCard = (
    <div className="space-y-3 rounded-md bg-primary p-4 text-primary-foreground shadow-sm lg:shrink-0">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-primary-foreground/80">
        <GraduationCap className="h-3.5 w-3.5" />
        {t("overviewTitle")}
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <dt className="text-xs text-primary-foreground/70">{t("levelLabel")}</dt>
          <dd>
            <span className="inline-flex h-6 items-center rounded-md bg-primary-foreground/20 px-2 text-xs font-bold ring-1 ring-inset ring-primary-foreground/30">
              {lesson.difficulty}
            </span>
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-primary-foreground/70">{t("languageLabel")}</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            <Globe className="h-3.5 w-3.5 text-primary-foreground/70" />
            {lesson.language?.name}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-primary-foreground/70">{t("typeLabel")}</dt>
          <dd className="flex items-center gap-1.5 font-semibold">
            {lesson.isRecessActivity ? <Coffee className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5 text-primary-foreground/70" />}
            {lesson.isRecessActivity ? t("typeRecess") : t("typeRegular")}
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs text-primary-foreground/70">{t("questionsLabel")}</dt>
          <dd className="font-semibold">{questions.length}</dd>
        </div>
      </dl>
    </div>
  );

  const QuizSection = (
    <div className="card space-y-4 p-4 lg:shrink-0">
      <div className="space-y-1">
        <SectionLabel icon={HelpCircle}>{t("quizTitle")}</SectionLabel>
        {questions.length > 0 && <p className="text-xs text-muted-foreground">{t("quizSubtitle", { count: questions.length })}</p>}
      </div>
      {questions.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">{t("noQuiz")}</p>
      ) : (
        <QuizSlides questions={questions} />
      )}
    </div>
  );

  const ItemsSection = (vocabulary.length > 0 || structures.length > 0) && (
    <div className="card space-y-4 p-4 lg:flex lg:min-h-[12rem] lg:flex-1 lg:flex-col lg:space-y-0 lg:gap-4 lg:overflow-hidden">
      <SectionLabel icon={ListChecks}>{t("learningItemsTitle")}</SectionLabel>
      <div className="space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
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
    </div>
  );

  const Sidebar = (
    <div className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
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
        <div className="hidden gap-6 lg:grid lg:h-[calc(100dvh-9rem)] lg:grid-cols-3">
          <div className="col-span-2 min-h-0" data-tour="teacher-lesson.content">
            {ContentSection}
          </div>
          <aside className="min-h-0 overflow-y-auto" data-tour="teacher-lesson.items">
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
