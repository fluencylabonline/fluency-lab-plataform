"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { format, startOfDay } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { AlertCircle, ChevronDown, Clock, Info, Loader2, RefreshCw, Ticket, User } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Vault, VaultBody, VaultContent, VaultHeader, VaultPrimaryButton, VaultSecondaryButton, VaultTitle } from "@/components/ui/vault";
import { VaultLoadingOverlay } from "@/components/ui/vault-loading-overlay";
import { cn } from "@/lib/utils";
import { RescheduleVault } from "@/modules/scheduling/_components/RescheduleVault";
import { cancelClassAction, getStudentScheduleAction } from "@/modules/scheduling/scheduling.actions";
import { classActions, groupByMonth, statusGroup, type StatusGroup } from "@/modules/scheduling/student-schedule.rules";
import type { ScheduledClass as BaseClass } from "@/modules/scheduling/scheduling.types";
import { useRegisterPageHelp } from "@/modules/page-help/_components/PageHelpProvider";
import { useWizard } from "@/hooks/ui/use-wizard";
import { StudentHelpWizard } from "../../_components/StudentHelpWizard";

/** O servidor já traz o nome do professor junto de cada aula do aluno. */
type ScheduledClass = BaseClass & { teacherName?: string | null };

type CreditBalance = { total: number; bonus: number; "late-students": number; "teacher-cancellation": number };
type RescheduleStats = { count: number; limit: number };

interface Props {
  studentId: string;
  /** Do início de hoje até o fim do terceiro mês (já carregado pelo servidor). */
  initialClasses: ScheduledClass[];
  balance: CreditBalance;
  rescheduleStats: RescheduleStats;
}

const MAX_FUTURE_OFFSET = 12;

const PILL: Record<StatusGroup, string> = {
  scheduled: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  canceled: "bg-muted text-muted-foreground",
  noShow: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  recess: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
};

/** Junta listas sem repetir aulas; em caso de repetição vale a primeira (a mais recente do servidor). */
function mergeById(...lists: ScheduledClass[][]) {
  const map = new Map<string, ScheduledClass>();
  for (const list of lists) for (const cls of list) if (!map.has(cls.id)) map.set(cls.id, cls);
  return [...map.values()].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

/** Agenda do aluno: resumo, lista por mês e um painel com as ações que valem para cada aula. */
export function StudentSchedule({ studentId, initialClasses, balance, rescheduleStats }: Props) {
  const t = useTranslations("Schedule");
  const locale = useLocale();
  const router = useRouter();
  const dateLocale = locale === "en" ? enUS : ptBR;

  const [extraFuture, setExtraFuture] = useState<ScheduledClass[]>([]);
  const [futureOffset, setFutureOffset] = useState(3);
  const [extraPast, setExtraPast] = useState<ScheduledClass[]>([]);
  const [pastOffset, setPastOffset] = useState(0);
  const [pastOpen, setPastOpen] = useState(false);
  const [loading, setLoading] = useState<"future" | "past" | null>(null);

  const [selected, setSelected] = useState<ScheduledClass | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [overlay, setOverlay] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { isOpen: helpOpen, setIsOpen: setHelpOpen, completeWizard } = useWizard("student-schedule");
  // O (?) do header abre este wizard. Ver .agents/rules/page-help.md
  useRegisterPageHelp(setHelpOpen);

  const [now] = useState(() => new Date());
  // Momento em que a aula foi aberta: a regra das 4h é avaliada aqui, não a cada render.
  const [openedAt, setOpenedAt] = useState(now);
  const today = useMemo(() => startOfDay(now), [now]);
  const quotaLeft = Math.max(0, rescheduleStats.limit - rescheduleStats.count);

  const upcoming = useMemo(
    () => mergeById(initialClasses, extraFuture).filter((c) => new Date(c.startAt) >= today),
    [initialClasses, extraFuture, today]
  );
  const past = useMemo(() => mergeById(extraPast).filter((c) => new Date(c.startAt) < today).reverse(), [extraPast, today]);

  const upcomingGroups = useMemo(() => groupByMonth(upcoming), [upcoming]);
  const pastGroups = useMemo(() => groupByMonth(past), [past]);

  const loadMonth = async (offset: number) => {
    const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const res = await getStudentScheduleAction({ studentId, month: base.getMonth(), year: base.getFullYear() });
    return res?.data?.success ? ((res.data.data as ScheduledClass[]) ?? []) : [];
  };

  const loadMoreFuture = async () => {
    setLoading("future");
    const list = await loadMonth(futureOffset);
    setExtraFuture((prev) => [...prev, ...list]);
    setFutureOffset((n) => n + 1);
    setLoading(null);
  };

  // Ao abrir, traz o mês corrente (dias antes de hoje) e o anterior; "ver mais" volta mais um mês.
  const loadMorePast = async (count: number) => {
    setLoading("past");
    let offset = pastOffset;
    const loaded: ScheduledClass[] = [];
    for (let i = 0; i < count; i++) {
      loaded.push(...(await loadMonth(-offset)));
      offset += 1;
    }
    setExtraPast((prev) => [...prev, ...loaded]);
    setPastOffset(offset);
    setLoading(null);
  };

  const togglePast = () => {
    const next = !pastOpen;
    setPastOpen(next);
    if (next && pastOffset === 0) void loadMorePast(2);
  };

  const open = (cls: ScheduledClass) => {
    setSelected(cls);
    setOpenedAt(new Date());
    setConfirming(false);
    setDetailOpen(true);
  };

  const actions = selected
    ? classActions(selected, { now: openedAt, quotaExhausted: quotaLeft === 0, teacherCredits: balance["teacher-cancellation"] })
    : null;

  const cancel = async () => {
    if (!selected) return;
    setOverlay("loading");
    try {
      const res = await cancelClassAction({ classId: selected.id, reason: "canceled-student" });
      if (res?.data?.success) setOverlay("success");
      else {
        setErrorMsg(res?.data?.error || t("Error.generic"));
        setOverlay("error");
      }
    } catch (err) {
      setErrorMsg((err as Error).message || t("Error.generic"));
      setOverlay("error");
    }
  };

  const title = (cls: ScheduledClass) => cls.lessonTitle || t("Default.classTitle");

  const row = (cls: ScheduledClass) => {
    const start = new Date(cls.startAt);
    const group = statusGroup(cls.status);
    return (
      <li key={cls.id}>
        <button
          type="button"
          onClick={() => open(cls)}
          className="flex min-h-[64px] w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden>
            <span className="text-lg font-black leading-none">{format(start, "d")}</span>
            <span className="text-[9px] font-bold uppercase leading-none">{format(start, "EEE", { locale: dateLocale })}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{title(cls)}</span>
            <span className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="size-3" aria-hidden />{format(start, "HH:mm")}</span>
              {cls.teacherName && <span className="flex min-w-0 items-center gap-1"><User className="size-3 shrink-0" aria-hidden /><span className="truncate">{cls.teacherName}</span></span>}
            </span>
          </span>
          <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", PILL[group])}>{t(`Status.${group}`)}</span>
        </button>
      </li>
    );
  };

  const months = (groups: ReturnType<typeof groupByMonth<ScheduledClass>>) =>
    groups.map((g) => (
      <section key={g.key} className="space-y-2">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-primary">{format(g.date, "LLLL yyyy", { locale: dateLocale })}</h2>
          <span className="text-xs text-muted-foreground">{t("List.count", { count: g.items.length })}</span>
        </div>
        <ul className="space-y-2">{g.items.map(row)}</ul>
      </section>
    ));

  return (
    <>
      <Header title={t("title")} subtitle={t("description")} className="contents" />
      <main className="container max-w-2xl space-y-6 pb-12">
        <div data-tour="student-schedule.summary" className="rounded-2xl border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 rounded-xl bg-purple-500/10 p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple-500 text-white"><Ticket className="size-5" aria-hidden /></span>
              <div>
                <p className="text-xl font-black leading-none">{balance.total}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("Summary.credits")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-amber-500 text-white"><RefreshCw className="size-5" aria-hidden /></span>
              <div>
                <p className="text-xl font-black leading-none">{quotaLeft}<span className="text-sm font-semibold text-muted-foreground">/{rescheduleStats.limit}</span></p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{t("Summary.reschedules")}</p>
              </div>
            </div>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />{t("Summary.note")}</p>
        </div>

        <div data-tour="student-schedule.list" className="space-y-6">
          {upcomingGroups.length > 0 ? months(upcomingGroups) : <p className="rounded-2xl border-2 border-dashed border-muted px-4 py-10 text-center text-sm text-muted-foreground">{t("List.empty")}</p>}

          {futureOffset <= MAX_FUTURE_OFFSET && (
            <Button variant="outline" className="h-11 w-full rounded-full" disabled={loading === "future"} onClick={loadMoreFuture}>
              {loading === "future" && <Loader2 className="size-4 animate-spin" aria-hidden />}
              {t("List.loadMore")}
            </Button>
          )}
        </div>

        <section>
          <button type="button" onClick={togglePast} aria-expanded={pastOpen} className="flex min-h-[44px] w-full items-center justify-between rounded-xl px-1 text-sm font-bold text-muted-foreground">
            {t("List.past")}
            <ChevronDown className={cn("size-4 transition-transform", pastOpen && "rotate-180")} aria-hidden />
          </button>
          {pastOpen && (
            <div className="mt-3 space-y-6">
              {months(pastGroups)}
              {loading === "past" && <p className="flex justify-center py-2"><Loader2 className="size-4 animate-spin" aria-hidden /></p>}
              {loading !== "past" && pastGroups.length === 0 && <p className="text-center text-sm text-muted-foreground">{t("List.pastEmpty")}</p>}
              {loading !== "past" && (
                <Button variant="ghost" className="h-11 w-full rounded-full" onClick={() => loadMorePast(1)}>{t("List.loadPast")}</Button>
              )}
            </div>
          )}
        </section>
      </main>

      <Vault open={detailOpen} onOpenChange={(v) => overlay === "idle" && setDetailOpen(v)}>
        <VaultContent>
          <VaultLoadingOverlay
            state={overlay}
            loadingLabel={t("Actions.canceling")}
            successLabel={t("Success.canceled")}
            errorLabel={t("Error.generic")}
            errorSub={errorMsg}
            onDone={() => {
              if (overlay === "success") {
                setDetailOpen(false);
                router.refresh();
              }
              setOverlay("idle");
            }}
          />
          <VaultHeader>
            <VaultTitle>{selected ? title(selected) : t("Default.classTitle")}</VaultTitle>
          </VaultHeader>
          <VaultBody>
            {selected && actions && (
              <div className="flex flex-col gap-4 pb-2">
                <dl className="grid gap-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">{t("Details.date")}</dt><dd className="font-medium capitalize">{format(new Date(selected.startAt), "PPPP", { locale: dateLocale })}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t("Details.time")}</dt><dd className="font-medium">{format(new Date(selected.startAt), "HH:mm")} – {format(new Date(selected.endAt), "HH:mm")}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t("Details.teacher")}</dt><dd className="font-medium">{selected.teacherName || t("Details.teacherFallback")}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">{t("Details.status")}</dt><dd><span className={cn("inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide", PILL[statusGroup(selected.status)])}>{t(`Status.${statusGroup(selected.status)}`)}</span></dd></div>
                </dl>

                {/* uma só mensagem, a que explica o estado da aula */}
                {selected.status === "no-show" && <Notice tone="amber">{t("Policy.noShow")}</Notice>}
                {selected.status === "canceled-student" && <Notice tone="muted">{t("Policy.canceledStudent")}</Notice>}
                {selected.status === "canceled-teacher" && (
                  <Notice tone="red">{actions.noCredit ? t("Policy.canceledTeacherNoCredit") : t("Policy.canceledTeacher")}</Notice>
                )}
                {selected.status === "teacher-recess" && (
                  <Notice tone="purple">{actions.hasRecessActivity ? t("Policy.teacherRecessFallback") : t("Policy.teacherRecessNoFallback")}</Notice>
                )}
                {actions.cancelIsNoShow && <Notice tone="amber">{t("Policy.within4h")}</Notice>}
                {actions.quotaExhausted && <Notice tone="muted">{t("Policy.quotaExhausted")}</Notice>}

                {confirming ? (
                  <div className="flex flex-col gap-3 border-t pt-4">
                    <p className="text-center text-sm text-muted-foreground">{actions.cancelIsNoShow ? t("CancelConfirm.descriptionNoShow") : t("CancelConfirm.description")}</p>
                    <VaultPrimaryButton variant="destructive" className="w-full" disabled={overlay !== "idle"} onClick={cancel}>{t("CancelConfirm.confirm")}</VaultPrimaryButton>
                    <VaultSecondaryButton className="w-full" disabled={overlay !== "idle"} onClick={() => setConfirming(false)}>{t("CancelConfirm.back")}</VaultSecondaryButton>
                  </div>
                ) : (
                  (actions.canReschedule || actions.canCancel || actions.canReplaceWithCredit || actions.hasRecessActivity) && (
                    <div className="flex flex-col gap-3 border-t pt-4">
                      {actions.canReschedule && (
                        <VaultPrimaryButton variant="default" onClick={() => { setDetailOpen(false); setRescheduleOpen(true); }}>{t("Actions.reschedule")}</VaultPrimaryButton>
                      )}
                      {actions.canReplaceWithCredit && (
                        <VaultPrimaryButton variant="default" onClick={() => { setDetailOpen(false); setRescheduleOpen(true); }}>{t("Actions.replaceWithCredit")}</VaultPrimaryButton>
                      )}
                      {actions.hasRecessActivity && (
                        <VaultPrimaryButton variant="default" onClick={() => { setDetailOpen(false); router.push(`/hub/student/recess/${selected.id}`); }}>{t("Actions.viewRecessActivity")}</VaultPrimaryButton>
                      )}
                      {actions.canCancel && (
                        <VaultPrimaryButton variant="secondary" onClick={() => setConfirming(true)}>{t("Actions.cancel")}</VaultPrimaryButton>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </VaultBody>
        </VaultContent>
      </Vault>

      <RescheduleVault
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        selectedClass={selected}
        rescheduleStats={rescheduleStats}
        onSuccess={() => router.refresh()}
      />

      <StudentHelpWizard page="schedule" open={helpOpen} onOpenChange={setHelpOpen} onComplete={completeWizard} />
    </>
  );
}

const NOTICE: Record<string, string> = {
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  muted: "border-border bg-muted/50 text-muted-foreground",
  red: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  purple: "border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

function Notice({ tone, children }: { tone: keyof typeof NOTICE; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-start gap-2 rounded-md border p-3", NOTICE[tone])}>
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="text-xs">{children}</p>
    </div>
  );
}
