"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Plus,
  GripVertical,
  Video,
  FileText,
  Trash2,
  HelpCircle,
  Save,
  Loader2,
  Upload,
  Image as ImageIcon,
  Users,
  Layers,
  BookOpen,
  Eye,
  EyeOff,
  Clock
} from "lucide-react";
import Image from "next/image";
import { type User } from "@/modules/user/user.schema";
import { Course, Section, Lesson } from "@/modules/course/course.types";
import {
  updateCourseAction,
  deleteSectionAction,
  deleteLessonAction,
  reorderLessonsAction,
  reorderSectionsAction
} from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";
import { AddSectionVault } from "./AddSectionVault";
import { AddLessonVault } from "./AddLessonVault";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema } from "@/modules/course/course.schema";
import { z } from "zod";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton,
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const languages = [
  { label: "Inglês", value: "en" },
  { label: "Espanhol", value: "es" },
  { label: "Francês", value: "fr" },
  { label: "Alemão", value: "de" },
  { label: "Italiano", value: "it" },
  { label: "Japonês", value: "ja" },
  { label: "Português", value: "pt" },
];

interface CourseDetailClientProps {
  courseData: {
    course: Course;
    sections: (Section & { lessons: Lesson[] })[];
    studentCount: number;
  };
  currentUser: User;
}

function SortableLesson({ lesson, onDelete, onEdit }: {
  lesson: Lesson;
  onDelete: (id: string) => void;
  onEdit: (lesson: Lesson) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all group border-b border-slate-100 dark:border-slate-800 last:border-0",
        isDragging && "bg-white dark:bg-slate-900 shadow-xl border-primary/20 scale-[1.02] rounded-md z-50 relative"
      )}
    >
      <div className="flex items-center gap-4 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 p-2 hover:text-primary transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-lg"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center text-primary">
          {lesson.quizId ? <HelpCircle className="h-5 w-5" /> : lesson.contentType === "video" ? <Video className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {lesson.title}
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1 flex items-center gap-2">
            <Clock className="h-3 w-3" /> {lesson.duration || "0"} min {lesson.quizId && "• QUIZ DISPONÍVEL"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-md hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          onClick={() => onEdit(lesson)}
        >
          Editar Conteúdo
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-md text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(lesson.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function SortableSection({
  section,
  index,
  sensors,
  onAddLesson,
  onDelete,
  onEditLesson,
  onDeleteLesson,
  onLessonDragEnd
}: {
  section: Section & { lessons: Lesson[] };
  index: number;
  sensors: ReturnType<typeof useSensors>; // dnd-kit sensors type is complex to explicitly define here
  onAddLesson: () => void;
  onDelete: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onLessonDragEnd: (event: DragEndEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={cn(
        "card",
        isDragging && "border-primary/30 scale-[1.01] z-50 relative"
      )}
    >
      <div className="p-5 flex items-center justify-between bg-slate-200/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 p-2 hover:text-primary transition-colors bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Seção {index + 1}</span>
            <span className="font-bold text-xl leading-tight">
              {section.title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-md gap-2 px-4"
            onClick={onAddLesson}
          >
            <Plus className="h-4 w-4" />
            Nova Aula
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-md text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onLessonDragEnd}
        >
          <SortableContext
            items={section.lessons.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {section.lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  onDelete={onDeleteLesson}
                  onEdit={onEditLesson}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>

        {section.lessons.length === 0 && (
          <div className="p-10 text-center">
            <div className="inline-flex h-12 w-12 rounded-md bg-slate-50 dark:bg-slate-800 items-center justify-center text-muted-foreground mb-3">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Nenhuma aula nesta seção.</p>
            <Button variant="link" size="sm" onClick={onAddLesson} className="mt-1 text-primary">
              Adicionar primeira aula
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function CourseDetailClient({ courseData, currentUser }: CourseDetailClientProps) {
  const router = useRouter();
  const [course, setCourse] = useState(courseData.course);
  const [sections, setSections] = useState(courseData.sections);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [addLessonConfig, setAddLessonConfig] = useState<{ sectionId: string; open: boolean } | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ type: "section" | "lesson"; id: string; title: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);



  const tCommon = useTranslations("Common");

  const form = useForm<z.input<typeof insertCourseSchema>>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: course.title,
      description: course.description,
      language: course.language,
      imageUrl: course.imageUrl,
      duration: course.duration,
    },
  });

  const { formState: { isDirty, isSubmitting }, handleSubmit, watch, setValue } = form;
  const currentImageUrl = watch("imageUrl");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const stats = useMemo(() => {
    const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);
    return {
      students: courseData.studentCount,
      sections: sections.length,
      lessons: totalLessons
    };
  }, [sections, courseData.studentCount]);

  const handleEditContent = (lesson: Lesson) => {
    router.push(`/hub/admin/courses/${course.id}/lessons/${lesson.id}`);
  };

  const handleUpdateCourse = async (data: z.input<typeof insertCourseSchema>) => {
    const promise = updateCourseAction({ id: course.id, data });

    notify.promise(promise, {
      loading: "Salvando alterações...",
      success: (result) => {
        if (result?.data?.success) {
          setCourse(result.data.data as Course);
          form.reset(data);
          return "Curso atualizado com sucesso!";
        }
        throw new Error(result?.data?.error || "Erro ao atualizar curso");
      },
      error: (err: unknown) => (err as Error)?.message || "Ocorreu um erro"
    });
  };

  const handleTogglePublish = async () => {
    const newStatus = !course.isPublished;
    const prevCourse = { ...course };

    setCourse(prev => ({ ...prev, isPublished: newStatus }));

    const promise = updateCourseAction({
      id: course.id,
      data: { isPublished: newStatus }
    });

    notify.promise(promise, {
      loading: newStatus ? "Publicando curso..." : "Movendo para rascunho...",
      success: (result) => {
        if (result?.data?.success) {
          setCourse(result.data.data as Course);
          return newStatus ? "Curso publicado!" : "Curso movido para rascunho";
        }
        setCourse(prevCourse);
        throw new Error(result?.data?.error || "Erro ao alterar status");
      },
      error: (err: unknown) => {
        setCourse(prevCourse);
        return (err as Error).message;
      }
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    setDeleteConfig({ type: "section", id: sectionId, title: section.title });
  };

  const handleDeleteLesson = (lessonId: string) => {
    let lessonTitle = "";
    sections.forEach(s => {
      const lesson = s.lessons.find(l => l.id === lessonId);
      if (lesson) lessonTitle = lesson.title;
    });
    setDeleteConfig({ type: "lesson", id: lessonId, title: lessonTitle });
  };

  const confirmDelete = async () => {
    if (!deleteConfig) return;
    setIsDeleting(true);

    try {
      if (deleteConfig.type === "section") {
        const prevSections = [...sections];
        setSections(sections.filter(s => s.id !== deleteConfig.id));

        const result = await deleteSectionAction({ courseId: course.id, sectionId: deleteConfig.id });
        if (!result?.data?.success) {
          setSections(prevSections);
          notify.error(result?.data?.error || "Erro ao excluir seção");
        } else {
          notify.success("Seção excluída");
        }
      } else {
        const prevSections = [...sections];
        setSections(sections.map(s => ({
          ...s,
          lessons: s.lessons.filter(l => l.id !== deleteConfig.id)
        })));

        const result = await deleteLessonAction({ courseId: course.id, lessonId: deleteConfig.id });
        if (!result?.data?.success) {
          setSections(prevSections);
          notify.error(result?.data?.error || "Erro ao excluir aula");
        } else {
          notify.success("Aula excluída");
        }
      }
      setDeleteConfig(null);
    } catch {
      notify.error("Erro ao deletar seção");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent, sectionId?: string) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (!sectionId) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      await reorderSectionsAction({ courseId: course.id, sectionIds: newSections.map(s => s.id) });
      return;
    }

    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const section = sections[sectionIndex];
    const oldIndex = section.lessons.findIndex(l => l.id === active.id);
    const newIndex = section.lessons.findIndex(l => l.id === over.id);
    const newLessons = arrayMove(section.lessons, oldIndex, newIndex);
    const newSections = [...sections];
    newSections[sectionIndex] = { ...section, lessons: newLessons };
    setSections(newSections);
    await reorderLessonsAction({ courseId: course.id, lessonIds: newLessons.map(l => l.id) });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify.error("Selecione uma imagem");
    if (file.size > 5 * 1024 * 1024) return notify.error("Máximo 5MB");

    try {
      setUploading(true);
      const storageRef = ref(storage, `courses/covers/${course.id}-${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setValue("imageUrl", url, { shouldDirty: true });
      notify.success("Imagem carregada!");
    } catch {
      notify.error("Erro ao deletar aula");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <Header
        title={course.title}
        showSubHeader={false}
        user={currentUser}
        backHref="/hub/admin/courses"
      />

      <main className="container">
        <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column: Course Info & Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Image Preview & Upload */}
            <div className="card overflow-hidden group relative aspect-video">
              {currentImageUrl ? (
                <Image 
                  src={currentImageUrl} 
                  alt={course.title} 
                  fill 
                  className="object-cover rounded-md" 
                />
              ) : (
                <div className="w-full h-full bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-slate-300" />
                </div>
              )}
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md text-white">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 mb-2" />}
                <span className="font-bold text-sm">Alterar Capa</span>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Course Form */}
            <div className="card p-8 ">
              <form onSubmit={handleSubmit(handleUpdateCourse)} className="space-y-6">
                <Field label="Título do Curso" required error={form.formState.errors.title?.message}>
                  <Input {...form.register("title")} placeholder="Ex: Inglês para Viagem" />
                </Field>

                <Field label="Descrição" required error={form.formState.errors.description?.message}>
                  <Textarea
                    {...form.register("description")}
                    placeholder="Descreva o que os alunos aprenderão..."
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Idioma" error={form.formState.errors.language?.message}>
                    <Controller
                      name="language"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map(lang => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                  <Field label="Duração" error={form.formState.errors.duration?.message}>
                    <Input {...form.register("duration")} placeholder="Ex: 20h" />
                  </Field>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <Button
                    type="submit"
                    className="flex-1 h-12 rounded-md gap-2 font-bold"
                    disabled={!isDirty || isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<div className="flex items-center gap-2"><Save className="h-4 w-4" /> Salvar Alterações</div>)}
                  </Button>
                  <Button
                    type="button"
                    variant={course.isPublished ? "outline" : "default"}
                    className={cn(
                      "h-12 w-12 rounded-md p-0 flex items-center justify-center transition-all",
                      course.isPublished && "border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20"
                    )}
                    onClick={handleTogglePublish}
                  >
                    {course.isPublished ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </Button>
                </div>
              </form>
            </div>

            {/* Stats Card */}
            <div className="card p-8 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="h-10 w-10 rounded-md bg-white dark:bg-slate-800  flex items-center justify-center mx-auto mb-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div className="text-xl font-bold">{stats.students}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Alunos</div>
              </div>
              <div className="text-center border-x border-primary/10">
                <div className="h-10 w-10 rounded-md bg-white dark:bg-slate-800  flex items-center justify-center mx-auto mb-2 text-primary">
                  <Layers className="h-5 w-5" />
                </div>
                <div className="text-xl font-bold">{stats.sections}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Módulos</div>
              </div>
              <div className="text-center">
                <div className="h-10 w-10 rounded-md bg-white dark:bg-slate-800  flex items-center justify-center mx-auto mb-2 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="text-xl font-bold">{stats.lessons}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Aulas</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Curriculum */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Conteúdo do Curso</h2>
                <p className="text-sm text-muted-foreground">Gerencie a estrutura e ordem das aulas.</p>
              </div>
              <Button size="lg" className="rounded-md h-12 px-6 gap-2 font-bold" onClick={() => setIsAddSectionOpen(true)}>
                <Plus className="h-5 w-5" />
                Nova Seção
              </Button>
            </div>

            <div className="space-y-6 pb-20">
              {hasMounted ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e)}>
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <AnimatePresence mode="popLayout">
                      {sections.map((section, sIndex) => (
                        <SortableSection
                          key={section.id}
                          section={section}
                          index={sIndex}
                          sensors={sensors}
                          onAddLesson={() => setAddLessonConfig({ sectionId: section.id, open: true })}
                          onDelete={() => handleDeleteSection(section.id)}
                          onEditLesson={handleEditContent}
                          onDeleteLesson={handleDeleteLesson}
                          onLessonDragEnd={(e) => handleDragEnd(e, section.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="space-y-6">
                  {sections.map((section) => (
                    <div key={section.id} className="card p-5 opacity-50">
                      <div className="flex items-center gap-4">
                        <div className="h-5 w-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="flex flex-col gap-1">
                          <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                          <div className="h-5 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sections.length === 0 && (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50/30">
                  <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-md  flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Layers className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold">Nenhum conteúdo ainda</h3>
                  <p className="text-muted-foreground mb-6">Comece criando o primeiro módulo do seu curso.</p>
                  <Button onClick={() => setIsAddSectionOpen(true)} size="lg" className="rounded-md">
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Primeira Seção
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      <AddSectionVault
        open={isAddSectionOpen}
        onOpenChange={setIsAddSectionOpen}
        courseId={course.id}
        nextOrder={sections.length + 1}
        onSuccess={(newSection) => {
          setSections([...sections, { ...newSection, lessons: [] }]);
        }}
      />

      {addLessonConfig && (
        <AddLessonVault
          open={addLessonConfig.open}
          onOpenChange={(open) => setAddLessonConfig(prev => prev ? { ...prev, open } : null)}
          courseId={course.id}
          sectionId={addLessonConfig.sectionId}
          nextOrder={(sections.find(s => s.id === addLessonConfig.sectionId)?.lessons.length || 0) + 1}
          onSuccess={(newLesson) => {
            setSections(sections.map(s =>
              s.id === addLessonConfig.sectionId
                ? { ...s, lessons: [...s.lessons, newLesson] }
                : s
            ));
          }}
        />
      )}

      {/* Delete Confirmation Vault */}
      <Vault open={!!deleteConfig} onOpenChange={(open) => !open && setDeleteConfig(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="delete" />
            <VaultTitle>Excluir {deleteConfig?.type === "section" ? "Seção" : "Aula"}</VaultTitle>
            <VaultDescription>
              Tem certeza que deseja excluir &quot;<strong>{deleteConfig?.title}</strong>&quot;?
              {deleteConfig?.type === "section" && " Todas as aulas desta seção também serão removidas."} Esta ação não pode ser desfeita.
            </VaultDescription>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setDeleteConfig(null)}>
              {tCommon("cancel")}
            </VaultSecondaryButton>
            <VaultPrimaryButton
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? tCommon("loading") : tCommon("delete")}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
