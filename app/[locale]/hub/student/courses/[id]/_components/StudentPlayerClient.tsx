"use client";

import { useState, useMemo, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Progress } from "@/components/ui/progress";
import { VideoPlayer } from "@/components/ui/video-player";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Button } from "@/components/ui/button";

import { Course, Section, Lesson, Enrollment } from "@/modules/course/course.types";
import { updateProgressAction } from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Menu,
  X,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuizPlayer } from "./QuizPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/ui/use-device";

import { type User } from "@/modules/user/user.schema";

interface StudentPlayerClientProps {
  courseData: {
    course: Course;
    sections: (Section & { lessons: Lesson[] })[];
    studentCount: number;
  };
  enrollment: Enrollment;
  currentUser: User;
}

export function StudentPlayerClient({ courseData, enrollment, currentUser }: StudentPlayerClientProps) {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Set sidebar open by default on desktop
  useEffect(() => {
    if (!isMobile) {
      const timer = setTimeout(() => setIsSidebarOpen(true), 0);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  const [currentLessonId, setCurrentLessonId] = useState<string | null>(() => {
    return courseData.sections[0]?.lessons[0]?.id || null;
  });

  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>(enrollment.progress.lessons || {});

  // Flattened lessons for navigation
  const allLessons = useMemo(() => {
    return courseData.sections.flatMap(s => s.lessons);
  }, [courseData.sections]);

  const currentLessonIndex = allLessons.findIndex(l => l.id === currentLessonId);
  const currentLesson = allLessons[currentLessonIndex];

  const handleLessonSelect = (lessonId: string) => {
    setCurrentLessonId(lessonId);
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleLessonCompletion = async (lessonId: string) => {
    const currentStatus = lessonProgress[lessonId] === 100;
    const newPercentage = currentStatus ? 0 : 100;

    setLessonProgress(prev => ({ ...prev, [lessonId]: newPercentage }));

    const result = await updateProgressAction({
      courseId: courseData.course.id,
      lessonId,
      percentage: newPercentage,
    });

    if (!result?.data?.success) {
      notify.error(result?.data?.error || "Erro ao atualizar progresso");
      setLessonProgress(prev => ({ ...prev, [lessonId]: currentStatus ? 100 : 0 }));
    }
  };

  const handleNextLesson = () => {
    const nextIndex = currentLessonIndex + 1;
    if (nextIndex < allLessons.length) {
      handleLessonSelect(allLessons[nextIndex].id);
    }
  };

  const handlePrevLesson = () => {
    const prevIndex = currentLessonIndex - 1;
    if (prevIndex >= 0) {
      handleLessonSelect(allLessons[prevIndex].id);
    }
  };

  const completedCount = Object.values(lessonProgress).filter(p => p === 100).length;
  const progressPercentage = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;

  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-black overflow-hidden">
      <Header
        title={courseData.course.title}
        showSubHeader={false}
        user={currentUser}
        backHref="/hub/student/courses"
        action={isMobile ? {
          label: "Menu",
          icon: isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />,
          onClick: () => setIsSidebarOpen(!isSidebarOpen)
        } : undefined}
        className="contents"
      />

      <div className="flex flex-1 overflow-hidden relative">
        <AnimatePresence>
          {isMobile && isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        <aside
          className={cn(
            "absolute inset-y-0 left-0 z-10 w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform lg:relative lg:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-black/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Progresso</span>
                <span className="text-xs font-bold text-primary">{completedCount}/{allLessons.length}</span>
              </div>
              <Progress value={progressPercentage} className="h-2 rounded-full" />
            </div>

            <div className="p-4 space-y-6">
              {courseData.sections.map((section, sIndex) => (
                <div key={section.id} className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-2">
                    {sIndex + 1}. {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.lessons.map((lesson) => {
                      const isSelected = lesson.id === currentLessonId;
                      const isCompleted = lessonProgress[lesson.id] === 100;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonSelect(lesson.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                              : "hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                        >
                          <div className={cn(
                            "flex-shrink-0",
                            isSelected ? "text-primary-foreground" : isCompleted ? "text-primary" : "text-gray-400"
                          )}>
                            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-medium truncate",
                              isSelected ? "text-primary-foreground" : "text-gray-900 dark:text-gray-100"
                            )}>
                              {lesson.title}
                            </p>
                            <p className={cn(
                              "text-[10px] uppercase tracking-wider font-bold mt-0.5",
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {lesson.contentType} • {lesson.duration || "0"} min
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-white dark:bg-black relative">
          <AnimatePresence mode="wait">
            {currentLesson ? (
              <motion.div
                key={currentLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto p-4 md:p-8 pb-40 space-y-8"
              >
                <div className="space-y-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{currentLesson.title}</h1>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-4 w-4" />
                        {currentLesson.duration || "0"} min
                      </span>
                      <span>•</span>
                      <button
                        onClick={() => toggleLessonCompletion(currentLesson.id)}
                        className={cn(
                          "flex items-center gap-1 font-bold transition-colors",
                          lessonProgress[currentLesson.id] === 100 ? "text-primary" : "hover:text-primary"
                        )}
                      >
                        {lessonProgress[currentLesson.id] === 100 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Concluída
                          </>
                        ) : (
                          <>
                            <Circle className="h-4 w-4" />
                            Marcar como concluída
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={handlePrevLesson} disabled={currentLessonIndex === 0}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={handleNextLesson} disabled={currentLessonIndex === allLessons.length - 1}>
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Render Content Blocks */}
                <div className="w-full space-y-8">
                  {currentLesson.contentBlocks.map((block, bIndex) => (
                    <div key={bIndex} className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                      {block.type === "video" ? (
                        <VideoPlayer url={block.url} provider={block.provider} />
                      ) : (
                        <div className="prose dark:prose-invert max-w-none">
                          <RichTextEditor content={block.content} onChange={() => { }} editable={false} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Render Quiz if it exists */}
                {currentLesson.quiz && (
                  <div className="pt-12 border-t border-gray-100 dark:border-gray-800">
                    <QuizPlayer
                      quizId={currentLesson.quiz.id}
                      questions={currentLesson.quiz.questions}
                      initialResult={currentLesson.quiz.lastSubmission ? {
                        score: currentLesson.quiz.lastSubmission.score,
                        passed: currentLesson.quiz.lastSubmission.passed,
                        answers: currentLesson.quiz.lastSubmission.answers as Record<string, string>,
                        correctCount: 0,
                        totalCount: currentLesson.quiz.questions.length
                      } : null}
                      onComplete={(score, passed) => {
                        if (passed) toggleLessonCompletion(currentLesson.id);
                      }}
                    />
                  </div>
                )}

                {/* Empty State if neither exists */}
                {currentLesson.contentBlocks.length === 0 && !currentLesson.quiz && (
                  <div className="p-12 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl">
                    <FileText className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-muted-foreground">Esta aula ainda não tem conteúdo disponível.</p>
                  </div>
                )}

              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <PlayCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold mb-2">Selecione uma aula</h2>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Escolha uma aula no menu lateral para começar a aprender.
                </p>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
