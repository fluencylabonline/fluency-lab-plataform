"use client";

import { LessonSummary } from "@/modules/curriculum/curriculum.types";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { BookOpen, Tag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface LessonCardProps {
  lesson: LessonSummary;
}

export function LessonCard({ lesson }: LessonCardProps) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <div className="card flex flex-col h-full group p-4">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-medium uppercase tracking-wider">
          {lesson.language?.name || "Idioma"}
        </Badge>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Tag className="w-3 h-3" />
          <span className="text-[10px] font-medium uppercase tracking-wider">{lesson.difficulty}</span>
        </div>
      </div>

      <h3 className="text-base font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
        {lesson.title}
      </h3>

      <p className="text-sm text-muted-foreground line-clamp-3 italic mb-4 flex-1">
        {lesson.contentText || "Nenhuma descrição disponível."}
      </p>

      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <BookOpen className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Conteúdo</span>
        </div>

        <Link
          href={`/${locale}/hub/teacher/lessons/${lesson.id}`}
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "h-8 gap-2 text-xs font-bold hover:bg-primary/10 hover:text-primary"
          })}
        >
          Ver Detalhes
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
