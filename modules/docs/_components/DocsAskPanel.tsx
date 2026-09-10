"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { askDocsAction, rateDocsAnswerAction } from "../docs.actions";
import { findArticle } from "../docs.corpus";
import { DOC_AUDIENCES, type DocAudience } from "../docs.registry";
import type { DocArticle, DocSection } from "../docs.types";
import { InlineText } from "./DocBlocks";

type Failure = "rate_limited" | "quota_exhausted" | "unavailable" | "forbidden";

const FAILURE_MESSAGES: Record<Failure, { title: string; text: string }> = {
  rate_limited: {
    title: "Você fez muitas perguntas seguidas",
    text: "Aguarde alguns minutos antes de perguntar de novo. A busca por texto continua disponível.",
  },
  quota_exhausted: {
    title: "A ajuda por IA atingiu o limite de hoje",
    text: "Tente novamente amanhã. Enquanto isso, use a busca por texto — ela cobre toda a documentação.",
  },
  unavailable: {
    title: "Não consegui responder agora",
    text: "Houve uma falha temporária. Tente mais tarde ou use a busca por texto.",
  },
  forbidden: {
    title: "Sem acesso a esta documentação",
    text: "Você não tem permissão para consultar este público.",
  },
};

interface AnswerState {
  questionId: string;
  question: string;
  answer: string;
  foundAnswer: boolean;
  articleIds: string[];
}

interface DocsAskPanelProps {
  audience: DocAudience;
  /** Pergunta digitada no campo de busca. */
  query: string;
  /**
   * Incrementado pelo DocsClient quando o usuário pressiona Enter na busca.
   * É um contador, e não a pergunta em si, para que perguntar duas vezes o
   * mesmo texto dispare de novo.
   */
  submitCount: number;
  /** Número do WhatsApp da coordenação, em dígitos (ex.: 554936180727). */
  whatsappNumber: string | null;
  onOpenArticle: (section: DocSection, article: DocArticle) => void;
}

export function DocsAskPanel({
  audience,
  query,
  submitCount,
  whatsappNumber,
  onOpenArticle,
}: DocsAskPanelProps) {
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<AnswerState | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [feedback, setFeedback] = useState<"helpful" | "not_helpful" | null>(null);

  const trimmed = query.trim();
  const canAsk = trimmed.length >= 5;

  // Trocar de público ou digitar outra coisa invalida a resposta anterior.
  useEffect(() => {
    setAnswer(null);
    setFailure(null);
    setFeedback(null);
  }, [audience]);

  const ask = useCallback(
    async (question: string) => {
      if (question.trim().length < 5 || isAsking) return;

      setIsAsking(true);
      setFailure(null);
      setFeedback(null);
      setAnswer(null);

      try {
        const result = await askDocsAction({ question, audience });

        if (result?.data?.success) {
          const data = result.data.data;
          setAnswer({
            questionId: data.questionId,
            question,
            answer: data.answer,
            foundAnswer: data.foundAnswer,
            articleIds: data.articleIds,
          });
        } else {
          setFailure((result?.data?.error as Failure) ?? "unavailable");
        }
      } catch {
        setFailure("unavailable");
      } finally {
        setIsAsking(false);
      }
    },
    [audience, isAsking],
  );

  // Enter no campo de busca dispara a pergunta.
  useEffect(() => {
    if (submitCount > 0) void ask(query);
    // `ask` muda a cada render por depender de isAsking; seguir só o contador
    // garante um disparo por Enter, que é exatamente a intenção.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitCount]);

  const sendFeedback = useCallback(
    async (value: "helpful" | "not_helpful") => {
      if (!answer) return;
      setFeedback(value);
      try {
        await rateDocsAnswerAction({ questionId: answer.questionId, feedback: value });
      } catch {
        notify.error("Não foi possível registrar seu feedback.");
      }
    },
    [answer],
  );

  const buildWhatsAppUrl = (question: string) => {
    if (!whatsappNumber) return null;
    const text = `Olá! Tenho uma dúvida que não encontrei na Central de Ajuda:\n\n"${question}"`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  };

  // Estado inicial: sem busca ativa, mostramos exemplos que ensinam o formato.
  if (!trimmed) {
    return (
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-border/50 bg-primary/[0.04] px-5 py-3.5">
          <Sparkles className="size-4 text-primary" />
          <p className="text-sm font-bold tracking-tight">Perguntar à IA</p>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Responde só com base na documentação
          </span>
        </div>
        <div className="flex flex-col gap-2.5 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            Escreva sua dúvida no campo acima e pressione Enter. Por exemplo:
          </p>
          <div className="flex flex-col gap-1.5">
            {DOC_AUDIENCES[audience].sampleQuestions.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => ask(sample)}
                disabled={isAsking}
                className="group flex items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-left text-[13px] text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-foreground disabled:opacity-50"
              >
                <ArrowRight className="size-3.5 shrink-0 text-primary/50 transition-transform group-hover:translate-x-0.5" />
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Disparo — a IA só é chamada aqui, nunca a cada tecla digitada. */}
      {!answer && !failure && (
        <button
          type="button"
          onClick={() => ask(trimmed)}
          disabled={!canAsk || isAsking}
          className={cn(
            "card group flex w-full items-center gap-3.5 px-5 py-4 text-left transition-colors",
            canAsk && !isAsking
              ? "hover:border-primary/40 hover:bg-primary/[0.03]"
              : "opacity-70",
          )}
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className={cn("size-4", isAsking && "animate-pulse")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-tight">
              {isAsking ? "Consultando a documentação…" : "Perguntar à IA"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {canAsk ? `“${trimmed}”` : "Escreva uma pergunta um pouco maior."}
            </p>
          </div>
          {!isAsking && canAsk && (
            <kbd className="hidden shrink-0 select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              Enter
            </kbd>
          )}
        </button>
      )}

      {/* Falha */}
      {failure && (
        <div className="card flex flex-col gap-3 border-amber-500/25 bg-amber-500/[0.04] px-5 py-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                {FAILURE_MESSAGES[failure].title}
              </p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                {FAILURE_MESSAGES[failure].text}
              </p>
            </div>
          </div>
          {whatsappNumber && failure !== "forbidden" && (
            <a
              href={buildWhatsAppUrl(trimmed) ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-bold transition-colors hover:border-emerald-500/40 hover:text-emerald-600"
            >
              <MessageCircle className="size-3.5" />
              Falar com a coordenação
            </a>
          )}
        </div>
      )}

      {/* Resposta */}
      {answer && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-border/50 bg-primary/[0.04] px-5 py-3">
            <Sparkles className="size-4 text-primary" />
            <p className="min-w-0 flex-1 truncate text-xs font-bold tracking-tight">
              {answer.question}
            </p>
          </div>

          {answer.foundAnswer ? (
            <div className="flex flex-col gap-4 px-5 py-4">
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                <InlineText text={answer.answer} />
              </p>

              {/* Citações — cada artigo vira navegação real, não enfeite. */}
              {answer.articleIds.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-border/50 pt-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Baseado nestes artigos
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {answer.articleIds.map((id) => {
                      const found = findArticle(audience, id);
                      if (!found) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => onOpenArticle(found.section, found.article)}
                          className="group flex items-center gap-2.5 rounded-lg border border-border/70 px-3 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                        >
                          <BookOpen className="size-3.5 shrink-0 text-primary/60" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-bold tracking-tight group-hover:text-primary">
                              {found.article.title}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {found.section.title}
                            </span>
                          </span>
                          <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Feedback — alimenta a revisão da documentação. */}
              <div className="flex items-center gap-2 border-t border-border/50 pt-3.5">
                {feedback ? (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Check className="size-3.5 text-emerald-500" />
                    Obrigado pelo retorno!
                  </p>
                ) : (
                  <>
                    <span className="text-xs text-muted-foreground">Esta resposta ajudou?</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2.5 text-xs"
                      onClick={() => sendFeedback("helpful")}
                    >
                      <ThumbsUp className="size-3" />
                      Sim
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 px-2.5 text-xs"
                      onClick={() => sendFeedback("not_helpful")}
                    >
                      <ThumbsDown className="size-3" />
                      Não
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Sem resposta na documentação — encaminha para a coordenação. */
            <div className="flex flex-col gap-3 px-5 py-4">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-bold tracking-tight">
                    Não encontrei isso na documentação
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    Sua dúvida pode ser sobre um caso específico, que só a coordenação
                    consegue verificar. Prefiro não arriscar uma resposta errada.
                  </p>
                </div>
              </div>

              {whatsappNumber ? (
                <a
                  href={buildWhatsAppUrl(answer.question) ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
                >
                  <MessageCircle className="size-3.5" />
                  Falar com a coordenação no WhatsApp
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Entre em contato com a coordenação para esclarecer essa dúvida.
                </p>
              )}

              <p className="text-[11px] text-muted-foreground/70">
                Sua pergunta foi registrada e vai nos ajudar a melhorar a documentação.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
