"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { useParams } from "next/navigation";

export interface StudentWithNextClass {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  nextClass: {
    startAt: Date;
    type: string;
  } | null;
}

interface StudentCardProps {
  student: StudentWithNextClass;
}

export function StudentCard({ student }: StudentCardProps) {
  const t = useTranslations("StudentCard");
  const params = useParams();
  const locale = params.locale as string;
  
  const dateLocale = locale === "pt" ? ptBR : enUS;

  const formatNextClassDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `${t("classToday")} ${format(date, "HH:mm")}`;
    }

    if (date.toDateString() === tomorrow.toDateString()) {
      return `${t("classTomorrow")} ${t("at")} ${format(date, "HH:mm")}`;
    }

    // Capitalize first letter of day name
    const dayName = format(date, "EEEE", { locale: dateLocale });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    const formattedDate = format(date, "dd/MM");
    const hours = format(date, "HH:mm");

    return `${capitalizedDay}, ${t("dayAt")} ${formattedDate} ${t("at")} ${hours}`;
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors border-none bg-card/50">
      <Link
        href={`/hub/teacher/students/${student.id}`}
        className="flex items-center space-x-4 p-4"
      >
        <Avatar size="lg">
          <AvatarImage src={student.photoUrl || ""} alt={student.name} />
          <AvatarFallback name={student.name} />
        </Avatar>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate text-primary leading-tight">
            {student.name}
          </h3>
          <p className="text-muted-foreground text-sm truncate">
            {student.email}
          </p>
          
          {student.nextClass ? (
            <div className="mt-2 flex flex-row items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium text-xs text-foreground">
                {formatNextClassDate(new Date(student.nextClass.startAt))}
              </span>
            </div>
          ) : (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground uppercase tracking-wider">
                {t("noScheduledClasse")}
              </span>
            </div>
          )}
        </div>
      </Link>
    </Card>
  );
}
