"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Wizard } from "@/components/ui/wizard";
import { ShowMeAroundButton } from "@/modules/page-help/_components/ShowMeAroundButton";
import { Users, UserMinus, Search } from "lucide-react";

interface TeacherStudentsWizardProps {
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

export function TeacherStudentsWizard({ open, onOpenChange, onComplete }: TeacherStudentsWizardProps) {
  const t = useTranslations("TeacherStudentsHelp");

  const steps = [
    {
      id: "visibility",
      title: t("visibility.title"),
      description: t("visibility.description"),
      icon: Users,
      headerBg: "bg-primary/10",
      iconColor: "text-primary",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("visibility.intro")}</p>
          <ul className="space-y-2">
            <Bullet color="bg-primary">{t("visibility.upcoming")}</Bullet>
            <Bullet color="bg-primary">{t("visibility.past")}</Bullet>
          </ul>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-[12px] text-foreground">
            <p>{t.rich("visibility.dynamic", { strong })}</p>
          </div>
        </div>
      ),
    },
    {
      id: "disappearance",
      title: t("disappearance.title"),
      description: t("disappearance.description"),
      icon: UserMinus,
      headerBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("disappearance.intro")}</p>
          <ul className="space-y-2">
            <Bullet color="bg-amber-500">{t("disappearance.noClasses")}</Bullet>
            <Bullet color="bg-amber-500">{t("disappearance.reassigned")}</Bullet>
          </ul>
        </div>
      ),
    },
    {
      id: "search",
      title: t("search.title"),
      description: t("search.description"),
      icon: Search,
      headerBg: "bg-emerald-500/10",
      iconColor: "text-emerald-500",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>{t("search.intro")}</p>
          <ul className="space-y-2">
            <Bullet color="bg-emerald-500">{t.rich("search.byName", { strong })}</Bullet>
            <Bullet color="bg-emerald-500">{t.rich("search.byEmail", { strong })}</Bullet>
          </ul>
          <p className="text-xs italic">{t("search.tip")}</p>
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
