"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { EmptyResults } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatBlock } from "@/modules/user/_components/userDetails/UserDetailsPrimitives";
import { cn } from "@/lib/utils";
import { DOC_AUDIENCES, type DocAudience } from "../docs.registry";
import { normalize } from "../docs.search";

interface QuestionRow {
  id: string;
  audience: string;
  question: string;
  answer: string;
  foundAnswer: boolean;
  articleIds: string[];
  feedback: string | null;
  createdAt: string;
  userName: string | null;
  userRole: string | null;
}

interface DocsQuestionsClientProps {
  questions: QuestionRow[];
  stats: { total: number; unanswered: number; notHelpful: number };
  currentAudience: string;
  onlyUnanswered: boolean;
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

/** Agrupa perguntas quase idênticas para revelar o que mais se repete. */
function groupQuestions(questions: QuestionRow[]) {
  const groups = new Map<string, { rows: QuestionRow[]; key: string }>();

  for (const row of questions) {
    // Normaliza acento/caixa e remove pontuação — "Como cancelo?" e
    // "como cancelo" viram a mesma chave.
    const key = normalize(row.question).replace(/[^a-z0-9\s]/g, "").trim();
    const existing = groups.get(key);
    if (existing) existing.rows.push(row);
    else groups.set(key, { rows: [row], key });
  }

  return Array.from(groups.values()).sort((a, b) => {
    // Repetidas primeiro; depois as mais recentes.
    if (b.rows.length !== a.rows.length) return b.rows.length - a.rows.length;
    return new Date(b.rows[0].createdAt).getTime() - new Date(a.rows[0].createdAt).getTime();
  });
}

export function DocsQuestionsClient({
  questions,
  stats,
  currentAudience,
  onlyUnanswered,
  user,
}: DocsQuestionsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const groups = useMemo(() => groupQuestions(questions), [questions]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all" || value === "0") params.delete(key);
    else params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div>
      <Header
        title="Perguntas à IA"
        subtitle="O que os usuários perguntam — e onde a documentação ainda falha."
        user={user}
        backHref="/hub/admin/docs"
        className="contents"
        showSubHeader={false}
      />

      <main className="container max-w-5xl flex flex-col gap-6 pb-16 pt-4">
        <div className="card grid grid-cols-1 divide-y divide-border/50 sm:grid-cols-3 sm:divide-x sm:divide-y-0" data-tour="admin-questions.stats">
          <StatBlock label="Perguntas feitas" value={String(stats.total)} />
          <StatBlock label="Sem resposta na doc" value={String(stats.unanswered)} accent />
          <StatBlock label="Marcadas como ruins" value={String(stats.notHelpful)} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={currentAudience}
            onValueChange={(v) => updateFilter("audience", v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os públicos</SelectItem>
              {Object.values(DOC_AUDIENCES).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={onlyUnanswered ? "1" : "0"}
            onValueChange={(v) => updateFilter("unanswered", v)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Todas as perguntas</SelectItem>
              <SelectItem value="1">Só as sem resposta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {groups.length === 0 ? (
          <EmptyResults
            title="Nenhuma pergunta ainda"
            description="Assim que alguém usar a IA da Central de Ajuda, as perguntas aparecem aqui."
          />
        ) : (
          <div className="flex flex-col gap-2" data-tour="admin-questions.list">
            {groups.map(({ rows, key }) => {
              const first = rows[0];
              const audienceLabel =
                DOC_AUDIENCES[first.audience as DocAudience]?.label ?? first.audience;

              return (
                <div
                  key={key}
                  className={cn(
                    "card flex flex-col gap-2.5 px-5 py-4",
                    !first.foundAnswer && "border-amber-500/30 bg-amber-500/[0.03]",
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-bold tracking-tight">{first.question}</p>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {rows.length > 1 && (
                        <Badge variant="secondary" className="h-5 gap-1 px-2 text-[10px] font-black">
                          <MessageSquare className="size-2.5" />
                          {rows.length}x
                        </Badge>
                      )}
                      <Badge variant="outline" className="h-5 px-2 text-[10px] font-medium">
                        {audienceLabel}
                      </Badge>
                    </div>
                  </div>

                  {first.foundAnswer ? (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {first.answer}
                    </p>
                  ) : (
                    <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <AlertCircle className="size-3.5" />
                      A IA não achou resposta — candidata a virar artigo novo.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 pt-2.5 text-[11px] text-muted-foreground">
                    <span>
                      {first.userName ?? "Usuário"}
                      {first.userRole ? ` · ${first.userRole}` : ""}
                    </span>
                    <span>
                      {format(new Date(first.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                    {first.articleIds.length > 0 && (
                      <span className="font-mono text-[10px] opacity-70">
                        {first.articleIds.join(", ")}
                      </span>
                    )}
                    {rows.some((r) => r.feedback === "helpful") && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <ThumbsUp className="size-3" />
                        {rows.filter((r) => r.feedback === "helpful").length}
                      </span>
                    )}
                    {rows.some((r) => r.feedback === "not_helpful") && (
                      <span className="flex items-center gap-1 text-red-500">
                        <ThumbsDown className="size-3" />
                        {rows.filter((r) => r.feedback === "not_helpful").length}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
