"use client";

import { useTranslations } from "next-intl";
import { useStudentCourses } from "@/hooks/data/use-student-courses";
import { Header } from "@/components/layout/header";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { PlayCircle, CheckCircle, Clock } from "lucide-react";
import Image from "next/image";
import { enrollAction } from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations"

interface StudentCourseClientProps {
  currentUser: {
    name: string;
    email: string;
    photoUrl?: string;
    role: string;
  };
}

export function StudentCourseClient({ currentUser }: StudentCourseClientProps) {
  const { courses, isLoading, mutate } = useStudentCourses();
  const t = useTranslations("Courses");

  const handleEnroll = async (courseId: string) => {
    const result = await enrollAction({ courseId });
    if (result?.data?.success) {
      notify.success("Matrícula realizada com sucesso!");
      mutate();
    } else {
      notify.error(result?.data?.error || "Erro ao realizar matrícula");
    }
  };

  const availableCourses = courses?.filter(c => c.isPublished) || [];

  return (
    <div className="flex flex-col h-full w-full">
      <Header
        title={t("title")}
        subtitle="Explore nossos cursos e acelere sua fluência."
        user={currentUser}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[320px] rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : availableCourses.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {availableCourses.map((course) => (
                <motion.div
                  key={course.id}
                  variants={itemVariants}
                  layout
                  className="card group relative flex flex-col overflow-hidden transition-all"
                >
                  {/* Top Image */}
                  <div className="aspect-[16/10] w-full overflow-hidden relative">
                    <Image
                      src={course.imageUrl || "/placeholder-course.jpg"}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Enrolled Badge */}
                    {course.isEnrolled && (
                      <div className="absolute top-3 left-3">
                        <Badge
                          className="backdrop-blur-md border-none px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-500/90 text-white"
                        >
                          {t("enrolled")}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-col p-5 gap-3 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                        {course.language}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        <span>{course.duration}</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {course.description || "Sem descrição disponível."}
                    </p>

                    {/* Progress Section */}
                    {course.isEnrolled && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          <span>{t("progress")}</span>
                          <span>{course.progressPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${course.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Area */}
                    <div className="pt-4 mt-auto">
                      {course.isEnrolled ? (
                        <Link
                          href={`/hub/student/courses/${course.id}`}
                          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-bold hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          {course.progressPercentage === 0 ? t("startCourse") : t("continueCourse")}
                          <PlayCircle className="h-4 w-4" />
                        </Link>
                      ) : (
                        <Button
                          onClick={() => handleEnroll(course.id)}
                          className="w-full h-12 rounded-xl font-bold gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          {t("enroll")}
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <EmptyResults />
        )}
      </main>
    </div>
  );
}
