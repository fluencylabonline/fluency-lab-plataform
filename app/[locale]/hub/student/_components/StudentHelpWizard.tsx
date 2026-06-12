"use client";

import { Wizard } from "@/components/ui/wizard";
import { useTranslations } from "next-intl";
import {
  Trophy,
  Video,
  Award,
  Sparkles,
  Calendar,
  PlusCircle,
  RefreshCw,
  Bell,
  Smartphone,
  Lock,
  Brain,
  Play,
  Clock,
  BookOpen,
  Route,
  BarChart,
} from "lucide-react";

interface StudentHelpWizardProps {
  page: "profile" | "schedule" | "settings" | "placement" | "notebook";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function StudentHelpWizard({
  page,
  open,
  onOpenChange,
  onComplete,
}: StudentHelpWizardProps) {
  const t = useTranslations("StudentHelpWizard");

  const getSteps = () => {
    const richStrong = {
      strongNode: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    };

    switch (page) {
      case "profile":
        return [
          {
            id: "profile_overview",
            title: t("profile.steps.overview.title"),
            description: t("profile.steps.overview.description"),
            icon: Trophy,
            headerBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("profile.steps.overview.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.overview.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.overview.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "profile_nextClass",
            title: t("profile.steps.nextClass.title"),
            description: t("profile.steps.nextClass.description"),
            icon: Video,
            headerBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("profile.steps.nextClass.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.nextClass.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.nextClass.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "profile_badges",
            title: t("profile.steps.badges.title"),
            description: t("profile.steps.badges.description"),
            icon: Award,
            headerBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("profile.steps.badges.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.badges.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.badges.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "profile_streak",
            title: t("profile.steps.streak.title"),
            description: t("profile.steps.streak.description"),
            icon: Sparkles,
            headerBg: "bg-orange-500/10",
            iconColor: "text-orange-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("profile.steps.streak.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.streak.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <span>{t.rich("profile.steps.streak.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
        ];

      case "schedule":
        return [
          {
            id: "schedule_calendar",
            title: t("schedule.steps.calendar.title"),
            description: t("schedule.steps.calendar.description"),
            icon: Calendar,
            headerBg: "bg-primary/10",
            iconColor: "text-primary",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("schedule.steps.calendar.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.calendar.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.calendar.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "schedule_credits",
            title: t("schedule.steps.credits.title"),
            description: t("schedule.steps.credits.description"),
            icon: PlusCircle,
            headerBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("schedule.steps.credits.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.credits.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.credits.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "schedule_policy",
            title: t("schedule.steps.policy.title"),
            description: t("schedule.steps.policy.description"),
            icon: RefreshCw,
            headerBg: "bg-rose-500/10",
            iconColor: "text-rose-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("schedule.steps.policy.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.policy.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{t.rich("schedule.steps.policy.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
        ];

      case "settings":
        return [
          {
            id: "settings_notifications",
            title: t("settings.steps.notifications.title"),
            description: t("settings.steps.notifications.description"),
            icon: Bell,
            headerBg: "bg-primary/10",
            iconColor: "text-primary",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("settings.steps.notifications.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.notifications.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.notifications.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "settings_app",
            title: t("settings.steps.app.title"),
            description: t("settings.steps.app.description"),
            icon: Smartphone,
            headerBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("settings.steps.app.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.app.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.app.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "settings_security",
            title: t("settings.steps.security.title"),
            description: t("settings.steps.security.description"),
            icon: Lock,
            headerBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("settings.steps.security.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.security.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("settings.steps.security.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
        ];

      case "placement":
        return [
          {
            id: "placement_intro",
            title: t("placement.steps.intro.title"),
            description: t("placement.steps.intro.description"),
            icon: Brain,
            headerBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("placement.steps.intro.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.intro.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.intro.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "placement_resume",
            title: t("placement.steps.resume.title"),
            description: t("placement.steps.resume.description"),
            icon: Play,
            headerBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("placement.steps.resume.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.resume.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.resume.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "placement_cooldown",
            title: t("placement.steps.cooldown.title"),
            description: t("placement.steps.cooldown.description"),
            icon: Clock,
            headerBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("placement.steps.cooldown.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.cooldown.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.cooldown.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "placement_history",
            title: t("placement.steps.history.title"),
            description: t("placement.steps.history.description"),
            icon: Trophy,
            headerBg: "bg-indigo-500/10",
            iconColor: "text-indigo-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("placement.steps.history.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.history.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                    <span>{t.rich("placement.steps.history.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
        ];

      case "notebook":
        return [
          {
            id: "notebook_shared",
            title: t("notebook.steps.shared.title"),
            description: t("notebook.steps.shared.description"),
            icon: BookOpen,
            headerBg: "bg-amber-500/10",
            iconColor: "text-amber-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("notebook.steps.shared.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.shared.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.shared.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "notebook_wotd",
            title: t("notebook.steps.wotd.title"),
            description: t("notebook.steps.wotd.description"),
            icon: Sparkles,
            headerBg: "bg-purple-500/10",
            iconColor: "text-purple-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("notebook.steps.wotd.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.wotd.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.wotd.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "notebook_path",
            title: t("notebook.steps.path.title"),
            description: t("notebook.steps.path.description"),
            icon: Route,
            headerBg: "bg-emerald-500/10",
            iconColor: "text-emerald-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("notebook.steps.path.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.path.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.path.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
          {
            id: "notebook_stats",
            title: t("notebook.steps.stats.title"),
            description: t("notebook.steps.stats.description"),
            icon: BarChart,
            headerBg: "bg-blue-500/10",
            iconColor: "text-blue-500",
            content: (
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground text-left">
                <p>{t("notebook.steps.stats.content1")}</p>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.stats.item1", richStrong)}</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="size-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{t.rich("notebook.steps.stats.item2", richStrong)}</span>
                  </li>
                </ul>
              </div>
            ),
          },
        ];

      default:
        return [];
    }
  };

  return (
    <Wizard
      open={open}
      onOpenChange={onOpenChange}
      steps={getSteps()}
      onComplete={() => {
        onComplete?.();
        onOpenChange(false);
      }}
    />
  );
}
