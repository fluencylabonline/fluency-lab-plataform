"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { finalizeProfileAction, saveProfileSurveyAction } from "@/modules/learning/learning.actions";
import { studentProfileSurveySchema } from "@/modules/learning/learning.schema";

type Values = Record<string, Record<string, unknown>>;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const GOALS = ["fluency", "travel", "work", "exams", "hobby", "moving", "other"];
const DAILY = ["none", "5_30min", "30_60min", "1h_plus"];
const EMPLOYMENT = ["employed", "seeking", "student"];
const USAGE = ["writing", "speaking", "balanced"];
const METHODS = ["visual", "auditory", "reading", "practical", "grammar"];
// Os valores salvos destas duas listas são os textos em português que a IA e o banco já usam.
const ACTIVITIES = ["Conversação", "Escuta", "Leitura", "Gramática", "Dinâmicas"];
const DIFFICULTIES = ["Pronúncia", "Gramática", "Vocabulário", "Escuta", "Falar em público"];
const ANXIETY = ["none", "low", "medium", "high", "very_high"];
const EXPECTATIONS = ["conversation_focus", "grammar_focus", "exam_prep", "business"];
const PACE = ["intense", "moderate", "relaxed"];
const ACCENT = ["intelligible", "natural"];
const CORRECTION = ["immediate", "important_only", "end_of_lesson", "gentle"];

interface Props {
  profileId: string;
  initialData: Values;
  basePath?: string;
}

function Section({ title, children, flagged }: { title: string; children: ReactNode; flagged?: boolean }) {
  return (
    <details open className={cn("group rounded-2xl border bg-card", flagged ? "border-amber-500/50" : "border-border")}>
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-base font-bold [&::-webkit-details-marker]:hidden">
        {title}
        {flagged && <AlertTriangle className="size-4 text-amber-500" aria-hidden />}
      </summary>
      <div className="space-y-5 border-t border-border/60 px-5 py-5">{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

interface ChipsProps {
  options: string[];
  label: (id: string) => string;
  selected: string[];
  onChange: (next: string[]) => void;
  max?: number;
  single?: boolean;
}

/** Opções em pílulas: escolha única (`single`) ou múltipla, com limite opcional. */
function Chips({ options, label, selected, onChange, max, single }: ChipsProps) {
  const toggle = (id: string) => {
    if (single) return onChange([id]);
    if (selected.includes(id)) return onChange(selected.filter((x) => x !== id));
    if (max && selected.length >= max) return;
    onChange([...selected, id]);
  };
  return (
    <div className="flex flex-wrap gap-2" role={single ? "radiogroup" : "group"}>
      {options.map((id) => {
        const on = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            role={single ? "radio" : "checkbox"}
            aria-checked={on}
            onClick={() => toggle(id)}
            className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50")}
          >
            {label(id)}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Revisão do perfil do aluno numa página só: os campos que a IA preencheu na aula experimental
 * (ou que já existiam) para o admin conferir, corrigir e ativar.
 */
export function StudentProfileReview({ profileId, initialData, basePath = "/hub/admin/students/onboarding" }: Props) {
  const t = useTranslations("ProfileReview");
  const router = useRouter();
  const [values, setValues] = useState<Values>(initialData);
  const [busy, setBusy] = useState<"save" | "finalize" | null>(null);
  const [dirty, setDirty] = useState(false);

  const get = <T,>(step: string, field: string, fallback: T): T => (values[step]?.[field] as T) ?? fallback;
  const set = (step: string, field: string, value: unknown) => {
    setValues((v) => ({ ...v, [step]: { ...v[step], [field]: value } }));
    setDirty(true);
  };

  const fieldLabel = (path: (string | number | symbol)[]) => {
    const key = `fields.${String(path[0])}.${String(path[1])}`;
    return path.length >= 2 && t.has(key) ? t(key) : path.map(String).join(".");
  };

  // Campos que o fechamento do perfil exige e ainda estão faltando ou inválidos.
  const problems = useMemo(() => {
    const parsed = studentProfileSurveySchema.safeParse(values);
    if (parsed.success) return { labels: [] as string[], steps: new Set<string>() };
    return {
      labels: [...new Set(parsed.error.issues.map((i) => fieldLabel(i.path)))],
      steps: new Set(parsed.error.issues.map((i) => String(i.path[0]))),
    };
    // fieldLabel depende só de `t`, estável por render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const persist = async () => {
    const res = await saveProfileSurveyAction({ id: profileId, responses: values });
    return !!res?.data?.profile?.id;
  };

  const save = async () => {
    setBusy("save");
    const ok = await persist();
    setBusy(null);
    if (ok) {
      setDirty(false);
      notify.success(t("saved"));
    } else notify.error(t("saveError"));
  };

  const finalize = async () => {
    if (problems.labels.length) return notify.error(t("missingToast"));
    setBusy("finalize");
    try {
      if (!(await persist())) return notify.error(t("saveError"));
      const res = await finalizeProfileAction({ profileId });
      if (!res?.data?.success) return notify.error(res?.data?.error || t("finalizeError"));
      notify.success(t("finalized"));
      router.push(basePath);
    } finally {
      setBusy(null);
    }
  };

  const o = (group: string) => (id: string) => t(`options.${group}.${id}`);
  const listLabel = (group: string, list: string[]) => (id: string) => (t.raw(`options.${group}`) as string[])[list.indexOf(id)] ?? id;
  const flagged = (step: string) => problems.steps.has(step);
  const activities = (get<Record<string, number>>("step7", "activityPreferences", {}));

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header title={t("title")} showSubHeader={false} backHref={basePath} />

      <main className="container max-w-2xl flex-1 space-y-4 py-6 pb-32" data-tour="manager-onboarding.form">
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>

        {problems.labels.length > 0 && (
          <div role="status" className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <p><strong>{t("missing")}</strong> {problems.labels.join(", ")}</p>
          </div>
        )}

        <Section title={t("sections.basic")} flagged={flagged("step1")}>
          <Field label={t("fields.step1.fullName")}><Input value={get("step1", "fullName", "")} onChange={(e) => set("step1", "fullName", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("fields.step1.approximateAge")}><Input value={get("step1", "approximateAge", "")} onChange={(e) => set("step1", "approximateAge", e.target.value)} /></Field>
            <Field label={t("fields.step1.occupation")}><Input value={get("step1", "occupation", "")} onChange={(e) => set("step1", "occupation", e.target.value)} /></Field>
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={get("step1", "isMinor", false)} onChange={(e) => set("step1", "isMinor", e.target.checked)} />
            {t("fields.step1.isMinor")}
          </label>
        </Section>

        <Section title={t("sections.history")} flagged={flagged("step2")}>
          <Field label={t("fields.step2.selfAssessedLevel")}>
            <Chips single options={LEVELS} label={(x) => x} selected={[get("step2", "selfAssessedLevel", "")]} onChange={([x]) => set("step2", "selfAssessedLevel", x)} />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" className="size-4 accent-primary" checked={get("step2", "previousStudy", false)} onChange={(e) => set("step2", "previousStudy", e.target.checked)} />
            {t("fields.step2.previousStudy")}
          </label>
          {get("step2", "previousStudy", false) && (
            <Field label={t("fields.step2.previousStudyDetails")}><Textarea rows={3} value={get("step2", "previousStudyDetails", "")} onChange={(e) => set("step2", "previousStudyDetails", e.target.value)} /></Field>
          )}
        </Section>

        <Section title={t("sections.goals")} flagged={flagged("step3")}>
          <Field label={t("fields.step3.mainGoals")}>
            <Chips options={GOALS} label={o("goals")} selected={get<string[]>("step3", "mainGoals", [])} onChange={(x) => set("step3", "mainGoals", x)} />
          </Field>
          {get<string[]>("step3", "mainGoals", []).includes("other") && (
            <Field label={t("fields.step3.customGoal")}><Input value={get("step3", "customGoal", "")} onChange={(e) => set("step3", "customGoal", e.target.value)} /></Field>
          )}
          <Field label={t("fields.step3.specificMotivation")}><Textarea rows={2} value={get("step3", "specificMotivation", "")} onChange={(e) => set("step3", "specificMotivation", e.target.value)} /></Field>
          <Field label={`${t("fields.step3.commitmentLevel")}: ${get("step3", "commitmentLevel", 5)}/10`}>
            <input type="range" min={1} max={10} className="accent-primary" value={get("step3", "commitmentLevel", 5)} onChange={(e) => set("step3", "commitmentLevel", Number(e.target.value))} />
          </Field>
        </Section>

        <Section title={t("sections.time")} flagged={flagged("step4")}>
          <Field label={`${t("fields.step4.weeklyFrequency")}: ${get("step4", "weeklyFrequency", 1)}`}>
            <input type="range" min={1} max={7} className="accent-primary" value={get("step4", "weeklyFrequency", 1)} onChange={(e) => set("step4", "weeklyFrequency", Number(e.target.value))} />
          </Field>
          <Field label={t("fields.step4.dailyStudyTime")}>
            <Chips single options={DAILY} label={o("daily")} selected={[get("step4", "dailyStudyTime", "")]} onChange={([x]) => set("step4", "dailyStudyTime", x)} />
          </Field>
        </Section>

        {!get("step1", "isMinor", false) && (
          <Section title={t("sections.career")} flagged={flagged("step5")}>
            <Field label={t("fields.step5.professionalArea")}><Input value={get("step5", "professionalArea", "")} onChange={(e) => set("step5", "professionalArea", e.target.value)} /></Field>
            <Field label={t("fields.step5.employmentStatus")}>
              <Chips single options={EMPLOYMENT} label={o("employment")} selected={[get("step5", "employmentStatus", "")]} onChange={([x]) => set("step5", "employmentStatus", x)} />
            </Field>
            <Field label={t("fields.step5.usageType")}>
              <Chips single options={USAGE} label={o("usage")} selected={[get("step5", "usageType", "")]} onChange={([x]) => set("step5", "usageType", x)} />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" className="size-4 accent-primary" checked={get("step5", "technicalVocabNeeded", false)} onChange={(e) => set("step5", "technicalVocabNeeded", e.target.checked)} />
              {t("fields.step5.technicalVocabNeeded")}
            </label>
          </Section>
        )}

        <Section title={t("sections.interests")} flagged={flagged("step6")}>
          <Field label={t("fields.step6.conversationTopics")}><Textarea rows={3} value={get("step6", "conversationTopics", "")} onChange={(e) => set("step6", "conversationTopics", e.target.value)} /></Field>
        </Section>

        <Section title={t("sections.style")} flagged={flagged("step7")}>
          <Field label={t("fields.step7.preferredMethods")}>
            <Chips options={METHODS} max={3} label={o("methods")} selected={get<string[]>("step7", "preferredMethods", [])} onChange={(x) => set("step7", "preferredMethods", x)} />
          </Field>
          <Field label={t("fields.step7.activityPreferences")}>
            <div className="grid gap-3 rounded-xl bg-muted/30 p-4">
              {ACTIVITIES.map((a) => (
                <label key={a} className="flex items-center justify-between gap-4 text-sm">
                  <span className="w-1/3">{listLabel("activities", ACTIVITIES)(a)}</span>
                  <input type="range" min={1} max={5} className="flex-1 accent-primary" value={activities[a] ?? 3} onChange={(e) => set("step7", "activityPreferences", { ...activities, [a]: Number(e.target.value) })} />
                </label>
              ))}
            </div>
          </Field>
        </Section>

        <Section title={t("sections.blocks")} flagged={flagged("step8")}>
          <Field label={t("fields.step8.mainDifficulties")}>
            <Chips options={DIFFICULTIES} label={listLabel("difficulties", DIFFICULTIES)} selected={get<string[]>("step8", "mainDifficulties", [])} onChange={(x) => set("step8", "mainDifficulties", x)} />
          </Field>
          <Field label={t("fields.step8.speakingAnxiety")}>
            <Chips single options={ANXIETY} label={o("anxiety")} selected={[get("step8", "speakingAnxiety", "")]} onChange={([x]) => set("step8", "speakingAnxiety", x)} />
          </Field>
        </Section>

        <Section title={t("sections.custom")} flagged={flagged("step9")}>
          <Field label={t("fields.step9.classExpectations")}>
            <Chips options={EXPECTATIONS} max={3} label={o("expectations")} selected={get<string[]>("step9", "classExpectations", [])} onChange={(x) => set("step9", "classExpectations", x)} />
          </Field>
          <Field label={t("fields.step9.learningPace")}>
            <Chips single options={PACE} label={o("pace")} selected={[get("step9", "learningPace", "")]} onChange={([x]) => set("step9", "learningPace", x)} />
          </Field>
          <Field label={t("fields.step9.accentGoal")}>
            <Chips single options={ACCENT} label={o("accent")} selected={[get("step9", "accentGoal", "")]} onChange={([x]) => set("step9", "accentGoal", x)} />
          </Field>
          <Field label={t("fields.step9.correctionStyle")}>
            <Chips single options={CORRECTION} label={o("correction")} selected={[get("step9", "correctionStyle", "")]} onChange={([x]) => set("step9", "correctionStyle", x)} />
          </Field>
        </Section>

        <Section title={t("sections.notes")}>
          <Field label={t("fields.step10.generalObservations")}><Textarea rows={4} value={get("step10", "generalObservations", "")} onChange={(e) => set("step10", "generalObservations", e.target.value)} /></Field>
        </Section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-3">
          <Button variant="outline" className="h-11 flex-1" disabled={busy !== null || !dirty} onClick={save}>
            {busy === "save" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t("save")}
          </Button>
          <Button className="h-11 flex-1 font-bold" disabled={busy !== null} onClick={finalize}>
            {busy === "finalize" && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {t("finalize")}
          </Button>
        </div>
      </div>
    </div>
  );
}
