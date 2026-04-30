"use client";

import React from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  Sparkles,
  BrainCircuit,
  Target,
  User as UserIcon,
  BookOpen,
  Zap,
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { generatePersonalizedPlanAction } from "@/modules/learning/learning.actions";
import { useTransition, useState } from "react";
import { notify } from "@/components/ui/toaster";

interface ProfileDiagnosisViewProps {
  profile: {
    id: string;
    studentId: string | null;
    qualitativeNotes: string | null;
    updatedAt: string | Date;
    student?: {
      name: string | null;
      email: string | null;
      lastPlacementTestDate: string | Date | null;
    };
    responses?: {
      step2?: { selfAssessedLevel: string };
      step3?: { commitmentLevel: number };
    };
  };
}

export function ProfileDiagnosisView({ profile }: ProfileDiagnosisViewProps) {
  const [isPending, startTransition] = useTransition();
  const [allowSuggestions, setAllowSuggestions] = useState(true);

  const qualitativeNotes = profile.qualitativeNotes || "";

  const handleGeneratePlan = () => {
    startTransition(async () => {
      const result = await generatePersonalizedPlanAction({
        profileId: profile.id,
        studentId: profile.studentId!,
        allowSuggestions,
      });

      if (result?.data?.success) {
        notify.success("Plano de estudos gerado com sucesso!");
      } else {
        notify.error(result?.serverError || "Erro ao gerar plano");
      }
    });
  };


  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={profile.student?.name || "Diagnóstico do Aluno"}
        subtitle="Análise pedagógica gerada por inteligência artificial com base no perfil e nivelamento."
      >
        <div className="flex items-center gap-3 mt-6">
          <Link href="/hub/manager/students/onboarding">
            <Button variant="ghost" size="sm" className="gap-2 rounded-md text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Voltar para Listagem
            </Button>
          </Link>
          <div className="h-4 w-px bg-border/60 mx-1" />
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1 rounded-md font-semibold text-[10px] uppercase tracking-wider">
            Perfil Ativo
          </Badge>
        </div>
      </Header>

      <main className="flex-1 container max-w-6xl py-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* AI Diagnosis Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Relatório Pedagógico</h2>
                  <p className="text-xs text-muted-foreground">Insights estratégicos processados por IA</p>
                </div>
              </div>

              <div className="relative">
                {qualitativeNotes ? (
                  <div className="border border-border/60 rounded-md overflow-hidden bg-muted/5">
                    <div className="max-h-[500px] overflow-y-auto p-6 md:p-8 custom-scrollbar">
                      <div className="prose prose-zinc dark:prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-base leading-relaxed text-foreground/80">
                          {qualitativeNotes}
                        </div>
                      </div>
                    </div>
                    <div className="px-6 py-3 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                      <span>Ref: {profile.id.slice(0, 8)}</span>
                      <span>Atualizado em {profile.updatedAt ? format(new Date(profile.updatedAt), "PP", { locale: ptBR }) : "-"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-md border-2 border-dashed border-border/60">
                    <BrainCircuit className="h-12 w-12 text-muted-foreground/20 mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">Aguardando geração do diagnóstico...</p>
                  </div>
                )}
              </div>
            </section>

            {/* Actions Section */}
            <section className="space-y-4">
              <div className="border border-border/60 rounded-md p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-primary">
                      <BrainCircuit className="h-4 w-4" />
                      <h3 className="font-bold">Geração de Plano</h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Configure como o plano de estudos deve ser estruturado antes de prosseguir.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 bg-muted/10 p-4 rounded-md border border-border/60">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider">IA Criativa</p>
                      <p className="text-[10px] text-muted-foreground">Sugerir temas se faltar no banco</p>
                    </div>
                    <Switch
                      checked={allowSuggestions}
                      onCheckedChange={setAllowSuggestions}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={!profile.studentId || !profile.student?.lastPlacementTestDate || isPending}
                    className="h-14 px-8 rounded-md gap-3 text-lg font-bold shadow-sm"
                  >
                    {isPending ? (
                      <>
                        <div className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin rounded-full" />
                        Gerando Plano...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5" />
                        Gerar Plano de Estudos
                        <ChevronRight className="h-4 w-4 opacity-40 ml-2" />
                      </>
                    )}
                  </Button>

                  {!profile.studentId ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-destructive text-xs font-medium">
                      <AlertTriangle className="size-4 shrink-0" />
                      Vincule um aluno para prosseguir.
                    </div>
                  ) : !profile.student?.lastPlacementTestDate ? (
                    <div className="flex items-center gap-2 px-3 py-2 text-amber-600 dark:text-amber-400 text-xs font-medium">
                      <AlertTriangle className="size-4 shrink-0" />
                      Teste de nivelamento pendente.
                    </div>
                  ) : null}
                </div>
              </div>

              <Link href={`/hub/manager/students/onboarding/${profile.id}`} className="block">
                <Button variant="outline" className="h-12 w-full rounded-md gap-2 text-sm font-semibold border-border/60">
                  <BookOpen className="h-4 w-4" /> Revisar Respostas do Survey
                </Button>
              </Link>
            </section>
          </div>

          {/* Sidebar Area */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Profile Card */}
            <div className="border border-border/60 rounded-md p-6 space-y-6 bg-muted/5">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-md bg-background border flex items-center justify-center text-primary font-bold">
                  {profile.student?.name ? (
                    <span className="text-lg uppercase">{profile.student.name.slice(0, 2)}</span>
                  ) : (
                    <UserIcon className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{profile.student?.name || "Não vinculado"}</h3>
                  <p className="text-xs text-muted-foreground truncate max-w-[150px]">{profile.student?.email || "Sem e-mail"}</p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</span>
                  <Badge variant="secondary" className="rounded-md px-2 py-0 h-5 text-[10px]">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nivelamento</span>
                  <span className="text-xs font-bold">
                    {profile.student?.lastPlacementTestDate
                      ? format(new Date(profile.student.lastPlacementTestDate), "dd/MM/yyyy")
                      : "Pendente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Card */}
            <div className="border border-border/60 rounded-md p-6 space-y-6">
              <h3 className="font-bold flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
                <Target className="h-4 w-4 text-primary" /> Dados Estruturais
              </h3>

              <div className="grid gap-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Nível Percebido</span>
                    <span className="text-primary">{profile.responses?.step2?.selfAssessedLevel || "A1"}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/40"
                      style={{ width: "20%" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Comprometimento</span>
                    <span className="text-primary">{profile.responses?.step3?.commitmentLevel || 5}/10</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(profile.responses?.step3?.commitmentLevel || 5) * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tech Specs */}
            <div className="p-6 bg-primary/5 rounded-md border border-primary/10">
              <h3 className="font-bold flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-2">
                <BrainCircuit className="h-4 w-4" /> Inteligência Ativa
              </h3>
              <p className="text-[11px] text-primary/70 leading-relaxed font-medium">
                Perfil vetorizado para recomendação semântica baseada em objetivos de carreira e interesses.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
