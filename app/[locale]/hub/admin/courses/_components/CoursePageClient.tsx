"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, MoreVertical, Globe, Activity } from "lucide-react";
import Image from "next/image";
import FallbackPlaceholder from '@/public/backgrounds/placeholder-course.jpg'
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/header";
import { EmptyResults } from "@/components/ui/empty";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { CreateCourseVault } from "./CreateCourseVault";
import { type User } from "@/modules/user/user.schema";
import { Course } from "@/modules/course/course.types";
import { containerVariants, itemVariants } from "@/lib/animations";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultFooter,
  VaultIcon,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { deleteCourseAction } from "@/modules/course/course.actions";
import { notify } from "@/components/ui/toaster";

interface CoursePageClientProps {
  initialData: Course[];
  currentUser: User;
}

export function CoursePageClient({ initialData, currentUser }: CoursePageClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [courses, setCourses] = useState(initialData);

  useEffect(() => {
    setCourses(initialData);
  }, [initialData]);

  const router = useRouter();

  const t = useTranslations("Courses");
  const tCommon = useTranslations("Common");

  const languages = useMemo(() => {
    const langs = new Set(courses.map((c) => c.language));
    return Array.from(langs).sort();
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        search === "" ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(search.toLowerCase()));

      const matchesLanguage = languageFilter === "all" || course.language === languageFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? course.isPublished : !course.isPublished);

      return matchesSearch && matchesLanguage && matchesStatus;
    });
  }, [courses, search, languageFilter, statusFilter]);

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteCourseAction({ id: courseToDelete.id });
      if (result?.data?.success) {
        notify.success(tCommon("success") || "Operação realizada com sucesso");
        setCourses(prev => prev.filter(c => c.id !== courseToDelete.id));
        setCourseToDelete(null);
      } else {
        notify.error(result?.data?.error || tCommon("error") || "Ocorreu um erro");
      }
    } catch {
      notify.error(tCommon("error") || "Ocorreu um erro");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <Header
        title={t("title")}
        subtitle={t("subtitle")}
        user={currentUser}
        onSearchChange={setSearch}
        actions={[{
          label: t("createCourse"),
          icon: <Plus className="w-4 h-4" />,
          onClick: () => setIsOpen(true)
        }]}
      />

      <main className="container">
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center">

          <div className="flex items-center gap-2">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="min-w-fit">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder={t("allLanguages") || "Todos os Idiomas"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLanguages") || "Todos os Idiomas"}</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-fit">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder={t("allStatuses") || "Todos os Status"} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses") || "Todos os Status"}</SelectItem>
                <SelectItem value="published">{t("statusPublished") || "Disponível"}</SelectItem>
                <SelectItem value="draft">{t("statusDraft") || "Rascunho"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredCourses.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  variants={itemVariants}
                  layout
                  className="card group relative flex flex-col overflow-hidden transition-all cursor-pointer"
                  onClick={() => router.push(`/hub/admin/courses/${course.id}`)}
                >
                  {/* Top Image */}
                  <div className="aspect-16/10 w-full overflow-hidden relative">
                    <Image
                      src={FallbackPlaceholder || course.imageUrl}
                      alt={course.title}
                      loading="lazy"
                      width={2000}
                      height={1600}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Badge at corner */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        variant={course.isPublished ? "default" : "secondary"}
                        className={cn(
                          "backdrop-blur-md border-none px-2 py-0.5 text-[10px] uppercase font-bold",
                          course.isPublished ? "bg-emerald-500/90 text-white" : "bg-orange-500/90 text-white"
                        )}
                      >
                        {course.isPublished ? "Disponível" : "Rascunho"}
                      </Badge>
                    </div>

                    {/* Quick Action Button - Dropdown */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="icon"
                            variant="secondary"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-primary/10 hover:text-primary group/item"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/hub/admin/courses/${course.id}`);
                            }}
                          >
                            <span className="font-medium text-sm">{t("editCourse")}</span>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-destructive/10 hover:text-destructive group/item"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCourseToDelete(course);
                            }}
                          >
                            <span className="font-medium text-sm">{t("deleteCourse")}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex flex-col p-5 gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                        {course.language}
                      </span>
                      <div className="text-xs font-bold text-muted-foreground">
                        <span>{course.duration}</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {course.description || t("noDescription")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyResults searchQuery={search} />
          )}
        </AnimatePresence>
      </main>

      <CreateCourseVault
        open={isOpen}
        onOpenChange={setIsOpen}
        onSuccess={(newCourse) => setCourses(prev => [newCourse, ...prev])}
      />

      {/* Delete Confirmation Vault */}
      <Vault open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="delete" />
            <VaultTitle>{t("deleteConfirmation")}</VaultTitle>
            <VaultDescription>
              {t("deleteWarning")}
            </VaultDescription>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setCourseToDelete(null)}>
              {tCommon("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? tCommon("loading") || "Excluindo..." : tCommon("delete") || "Excluir"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
