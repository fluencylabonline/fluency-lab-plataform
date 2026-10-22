"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent, type JSONContent } from "@tiptap/react";
import { useTranslations } from "next-intl";
import { AudioLines, BookOpen, CheckCircle2, Globe, HelpCircle, ListChecks, Pencil, Play, Square, Info } from "lucide-react";
import { StarterKit } from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Highlight } from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { levelBadgeClass } from "@/app/[locale]/hub/teacher/lessons/_components/level-style";
import type {
  LessonWithDetails,
  QuizData,
  QuizQuestion,
  Segment,
  StructureMetadata,
  VocabMetadata,
} from "@/modules/curriculum/curriculum.types";

import "@/components/tiptap-templates/simple/simple-editor.scss";
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap-node/image-node/image-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";

interface LessonViewerProps {
  lesson: LessonWithDetails;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function SectionLabel({ icon: Icon, children }: { icon: typeof BookOpen; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function ReadOnlyContent({ content }: { content: JSONContent }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: true } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      TableKit,
      TextStyle,
      Color,
    ],
    content,
    editable: false,
    immediatelyRender: false,
    editorProps: { attributes: { class: "simple-editor" } },
  });

  return <EditorContent editor={editor} />;
}

export function LessonViewer({ lesson }: LessonViewerProps) {
  const t = useTranslations("LessonViewer");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopAtRef = useRef<number | null>(null);
  const [playingKey, setPlayingKey] = useState<string | null>(null);

  const mediaUrl = lesson.media?.url && lesson.media.url !== "uploading..." ? lesson.media.url : null;
  const segments: Segment[] = useMemo(() => {
    const fromConfig = (lesson.media?.config as { segments?: Segment[] } | null)?.segments;
    return fromConfig?.length ? fromConfig : lesson.media?.transcriptionTimestamps ?? [];
  }, [lesson.media]);

  const quiz = lesson.quizData as QuizData | null;
  const sections = useMemo(
    () => quiz?.quiz_sections ?? (quiz?.questions ? [{ type: "questions", questions: quiz.questions }] : []),
    [quiz]
  );
  const questionCount = sections.reduce((sum, s) => sum + s.questions.length, 0);

  const vocabulary = lesson.items.filter((i) => i.item.type === "VOCABULARY");
  const structures = lesson.items.filter((i) => i.item.type === "STRUCTURE");

  const stop = useCallback(() => {
    audioRef.current?.pause();
    stopAtRef.current = null;
    setPlayingKey(null);
  }, []);

  const playRange = useCallback(
    (key: string, start: number, end: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (playingKey === key) {
        stop();
        return;
      }
      audio.currentTime = start;
      stopAtRef.current = end;
      setPlayingKey(key);
      void audio.play();
    },
    [playingKey, stop]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => {
      if (stopAtRef.current !== null && audio.currentTime >= stopAtRef.current) stop();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", stop);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", stop);
    };
  }, [stop]);

  const PlayButton = ({ id, start, end }: { id: string; start: number; end: number }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-7 shrink-0 gap-1 px-2 text-[11px]"
      onClick={() => playRange(id, start, end)}
    >
      {playingKey === id ? <Square className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      {formatTime(start)}–{formatTime(end)}
    </Button>
  );

  const correctOf = (q: QuizQuestion) =>
    q.correctAnswer ?? (q.correctIndex !== undefined ? q.options[q.correctIndex] : undefined);

  const contentJson = lesson.contentJson as JSONContent | null;
  const analysis = lesson.analysisResultJson;

  return (
    <div className="container space-y-4">
      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex h-6 items-center rounded-md px-2 text-xs font-bold ring-1 ring-inset", levelBadgeClass(lesson.difficulty))}>
            {lesson.difficulty}
          </span>
          <Badge variant="outline" className="gap-1 text-[10px] uppercase tracking-wider">
            <Globe className="h-3 w-3" />
            {lesson.language?.name}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {t("itemsCount", { count: lesson.items.length })}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {t("questionsCount", { count: questionCount })}
          </Badge>
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            v{lesson.version}
          </Badge>
        </div>
        <Link
          href={`/hub/manager/learning/lessons/${lesson.id}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("editDetails")}
        </Link>
      </div>

      {mediaUrl && <audio ref={audioRef} src={mediaUrl} preload="metadata" className="hidden" />}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mb-4 grid h-11 w-full grid-cols-2 gap-1 rounded-md bg-muted/50 p-1 md:grid-cols-5">
          <TabsTrigger value="content">{t("tabContent")}</TabsTrigger>
          <TabsTrigger value="audio">{t("tabAudio")}</TabsTrigger>
          <TabsTrigger value="items">{t("tabItems")}</TabsTrigger>
          <TabsTrigger value="quiz">{t("tabQuiz")}</TabsTrigger>
          <TabsTrigger value="details">{t("tabDetails")}</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-0 focus-visible:outline-none">
          <article className="card p-4 md:p-8">
            {contentJson ? (
              <ReadOnlyContent content={contentJson} />
            ) : (
              <p className="py-12 text-center italic text-muted-foreground">{t("noContent")}</p>
            )}
          </article>
        </TabsContent>

        <TabsContent value="audio" className="mt-0 space-y-4 focus-visible:outline-none">
          <div className="card space-y-4 p-4">
            <SectionLabel icon={AudioLines}>{t("audioTitle")}</SectionLabel>
            {mediaUrl ? (
              <>
                <div className="flex items-center gap-3">
                  <Button type="button" size="sm" className="gap-1.5" onClick={() => playRange("full", 0, Number.MAX_SAFE_INTEGER)}>
                    {playingKey === "full" ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {playingKey === "full" ? t("stop") : t("playAll")}
                  </Button>
                  <a href={mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-2 hover:underline">
                    {t("openFile")}
                  </a>
                </div>
                {lesson.media?.transcriptionText && (
                  <p className="rounded-md border-l-4 border-primary bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground/85">
                    {lesson.media.transcriptionText}
                  </p>
                )}
                {segments.length > 0 ? (
                  <ol className="space-y-2">
                    {segments.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-3 rounded-md bg-muted/40 px-3 py-2">
                        <PlayButton id={`seg-${idx}`} start={s.start} end={s.end} />
                        <span className="text-sm leading-snug">{s.word}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs italic text-muted-foreground">{t("noSegments")}</p>
                )}
              </>
            ) : (
              <p className="text-xs italic text-muted-foreground">{t("noAudio")}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-0 grid gap-4 focus-visible:outline-none lg:grid-cols-2">
          <div className="card space-y-3 p-4">
            <SectionLabel icon={ListChecks}>{t("vocabulary")} ({vocabulary.length})</SectionLabel>
            {vocabulary.length === 0 && <p className="text-xs italic text-muted-foreground">{t("noItems")}</p>}
            {vocabulary.map(({ item, priority }) => {
              const meta = item.metadata as VocabMetadata;
              return (
                <div key={item.id} className="space-y-1.5 rounded-md bg-muted/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{item.lemma}</span>
                    {meta.level && <Badge variant="outline" className="h-5 text-[10px]">{meta.level}</Badge>}
                    {meta.type && <Badge variant="outline" className="h-5 text-[10px]">{meta.type}</Badge>}
                    {meta.phonetic && <span className="text-xs text-muted-foreground">{meta.phonetic}</span>}
                    <Badge className="ml-auto h-5 text-[10px]">{priority}</Badge>
                  </div>
                  {meta.translation && <p className="text-xs font-medium text-primary">{meta.translation}</p>}
                  {meta.meanings?.map((m, i) => (
                    <p key={i} className="text-xs text-foreground/80">{m.definition}</p>
                  ))}
                  {meta.examples?.slice(0, 2).map((ex, i) => (
                    <p key={i} className="text-[11px] italic text-muted-foreground">
                      {ex.text} <span className="not-italic">— {ex.translation}</span>
                    </p>
                  ))}
                  {meta.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={meta.image_url} alt={item.lemma} className="h-20 w-20 rounded-md object-cover" loading="lazy" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="card space-y-3 p-4">
            <SectionLabel icon={BookOpen}>{t("structures")} ({structures.length})</SectionLabel>
            {structures.length === 0 && <p className="text-xs italic text-muted-foreground">{t("noItems")}</p>}
            {structures.map(({ item, priority }) => {
              const meta = item.metadata as StructureMetadata;
              return (
                <div key={item.id} className="space-y-1.5 rounded-md bg-muted/40 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{meta.structure_type || item.lemma}</span>
                    {meta.syntactic_pattern && <Badge variant="outline" className="h-5 text-[10px]">{meta.syntactic_pattern}</Badge>}
                    <Badge className="ml-auto h-5 text-[10px]">{priority}</Badge>
                  </div>
                  {meta.explanation && <p className="text-xs text-foreground/80">{meta.explanation}</p>}
                  {meta.examples?.slice(0, 2).map((ex, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-xs font-semibold">{ex.text}</p>
                      <p className="text-[11px] text-muted-foreground">{ex.translation}</p>
                      <div className="flex flex-wrap gap-1">
                        {ex.word_order?.map((w, j) => (
                          <span key={j} className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px]">
                            {w.word} <span className="uppercase text-muted-foreground">{w.role}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="quiz" className="mt-0 space-y-4 focus-visible:outline-none">
          {sections.length === 0 && (
            <div className="card p-4">
              <p className="text-xs italic text-muted-foreground">{t("noQuiz")}</p>
            </div>
          )}
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="card space-y-4 p-4">
              <SectionLabel icon={HelpCircle}>
                {t.has(`section.${section.type}`) ? t(`section.${section.type}`) : section.type} ({section.questions.length})
              </SectionLabel>
              <ol className="space-y-4">
                {section.questions.map((q, idx) => {
                  const correct = correctOf(q);
                  return (
                    <li key={q.id ?? idx} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold leading-snug">
                          <span className="mr-1.5 text-primary">{idx + 1}.</span>
                          {q.text}
                        </p>
                        {q.audioRange && <PlayButton id={`q-${sIdx}-${idx}`} start={q.audioRange.start} end={q.audioRange.end} />}
                      </div>
                      <ul className="space-y-1">
                        {q.options.map((option) => (
                          <li
                            key={option}
                            className={cn(
                              "flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs",
                              option === correct ? "bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-300" : "text-foreground/70"
                            )}
                          >
                            {option === correct ? (
                              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                            )}
                            {option}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && <p className="pl-2.5 text-[11px] leading-relaxed text-muted-foreground">{q.explanation}</p>}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="details" className="mt-0 focus-visible:outline-none">
          <div className="card space-y-3 p-4">
            <SectionLabel icon={Info}>{t("tabDetails")}</SectionLabel>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                [t("status"), lesson.status],
                [t("creationStep"), `${lesson.creationStep}/12`],
                [t("embedding"), lesson.embedding ? t("yes") : t("no")],
                [t("contentHash"), lesson.contentHash ?? "—"],
                [t("analysisVocabulary"), String(analysis?.vocabulary?.length ?? 0)],
                [t("analysisStructures"), String(analysis?.structures?.length ?? 0)],
                [t("lessonId"), lesson.id],
              ].map(([label, value]) => (
                <div key={label} className="space-y-0.5">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="break-all font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
