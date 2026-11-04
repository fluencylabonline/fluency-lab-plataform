"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Wizard } from "@/components/ui/wizard";
import { ShowMeAroundButton } from "@/modules/page-help/_components/ShowMeAroundButton";
import { Calendar, Notebook as NotebookIcon, Goal, Video } from "lucide-react";

interface StudentDetailsWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const strong = (chunks: ReactNode) => <strong>{chunks}</strong>;

function Bullet({ color, children }: { color: string; children: ReactNode }) {
  return (
    <li className="flex gap-2">
      <div className={`size-1.5 rounded-full ${color} mt-1.5 shrink-0`} />
      <span>{children}</span>
    </li>
  );
}

export function StudentDetailsWizard({ open, onOpenChange, onComplete }: StudentDetailsWizardProps) {
  const t = useTranslations("TeacherStudentDetailsHelp");

  const steps = [
    {
      id: "classes",
      title: t("classes.title"),
      description: t("classes.description"),
      icon: Calendar,
      headerBg: "bg-primary/10",
      iconColor: "text-primary",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t.rich("classes.intro", { strong })}</p>
          <ul className="space-y-2">
            <Bullet color="bg-primary">{t.rich("classes.attendance", { strong })}</Bullet>
            <Bullet color="bg-primary">{t.rich("classes.feedback", { strong })}</Bullet>
          </ul>
        </div>
      ),
    },
    {
      id: "notebooks",
      title: t("notebooks.title"),
      description: t("notebooks.description"),
      icon: NotebookIcon,
      headerBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t.rich("notebooks.intro", { strong })}</p>
          <ul className="space-y-2">
            <Bullet color="bg-amber-500">{t("notebooks.rich")}</Bullet>
            <Bullet color="bg-amber-500">{t("notebooks.access")}</Bullet>
            <Bullet color="bg-amber-500">{t.rich("notebooks.search", { strong })}</Bullet>
          </ul>
        </div>
      ),
    },
    {
      id: "live-classes",
      title: t("live.title"),
      description: t("live.description"),
      icon: Video,
      headerBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("live.intro")}</p>
          <ul className="space-y-2">
            <Bullet color="bg-blue-500">{t.rich("live.start", { strong })}</Bullet>
            <Bullet color="bg-blue-500">{t("live.noLinks")}</Bullet>
          </ul>
        </div>
      ),
    },
    {
      id: "roadmap",
      title: t("roadmap.title"),
      description: t("roadmap.description"),
      icon: Goal,
      headerBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t.rich("roadmap.intro", { strong })}</p>
          <ul className="space-y-2">
            <Bullet color="bg-emerald-500">{t("roadmap.add")}</Bullet>
            <Bullet color="bg-emerald-500">{t("roadmap.track")}</Bullet>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      onComplete={() => {
        onComplete?.();
        onOpenChange(false);
      }}
      extraFooter={<ShowMeAroundButton variant="outline" />}
    />
  );
}
