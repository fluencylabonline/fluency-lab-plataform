"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  ExternalLink,
  FileText,
  GraduationCap,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Presentation,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyResults } from "@/components/ui/empty";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { searchDocs } from "../docs.search";
import {
  DOC_AUDIENCES,
  type DocAudience,
  type DocAudienceMeta,
} from "../docs.registry";
import type { DocArticle, DocSection } from "../docs.types";
import { DocBlockView } from "./DocBlocks";
import { DocsAskPanel } from "./DocsAskPanel";

/** Ícones referenciados por nome no conteúdo e no registry. */
const ICONS: Record<string, React.ElementType> = {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Compass,
  FileText,
  GraduationCap,
  Headset,
  LayoutDashboard,
  LifeBuoy,
  Presentation,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
};

interface DocsClientProps {
  /** Públicos que o papel atual pode consultar. O primeiro é o padrão. */
  audiences: DocAudienceMeta[];
  /** Número do WhatsApp da coordenação, para o encaminhamento sem resposta. */
  whatsappNumber: string | null;
  user: {
    name: string | null;
    email: string | null;
    photoUrl?: string | null;
    role?: string;
  };
}

export function DocsClient({ audiences, whatsappNumber, user }: DocsClientProps) {
  const [audienceId, setAudienceId] = useState<DocAudience>(audiences[0].id);
  const [query, setQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState(
    audiences[0].sections[0].id,
  );
  const [highlightedArticleId, setHighlightedArticleId] = useState<string | null>(null);
  /** Contador de Enters na busca — cada incremento dispara uma pergunta à IA. */
  const [askSubmitCount, setAskSubmitCount] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const contentTopRef = useRef<HTMLDivElement>(null);

  const audience = DOC_AUDIENCES[audienceId];
  const sections = audience.sections;
  const canSwitchAudience = audiences.length > 1;

  const results = useMemo(() => searchDocs(query, audienceId), [query, audienceId]);
  const isSearching = query.trim().length > 0;

  const activeSection =
    sections.find((s) => s.id === activeSectionId) ?? sections[0];

  const totalArticles = useMemo(
    () => sections.reduce((sum, s) => sum + s.articles.length, 0),
    [sections],
  );

  /** Ctrl/Cmd+K foca a busca; Esc limpa e devolve o foco à página. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (event.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /**
   * O scroll acontece no container do hub, não na window — por isso usamos
   * scrollIntoView (que sobe pelo ancestral rolável) em vez de window.scrollTo.
   */
  const scrollToContentTop = useCallback(() => {
    contentTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSelectAudience = useCallback((next: DocAudienceMeta) => {
    setAudienceId(next.id);
    setActiveSectionId(next.sections[0].id);
    setQuery("");
    setAskSubmitCount(0);
  }, []);

  /** Abre um artigo vindo da busca: troca de seção, rola até ele e destaca. */
  const goToArticle = useCallback((section: DocSection, article: DocArticle) => {
    setActiveSectionId(section.id);
    setQuery("");
    setHighlightedArticleId(article.id);

    requestAnimationFrame(() => {
      document
        .getElementById(`doc-${article.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  // O destaque é só um pulso visual — some sozinho.
  useEffect(() => {
    if (!highlightedArticleId) return;
    const timeout = setTimeout(() => setHighlightedArticleId(null), 2000);
    return () => clearTimeout(timeout);
  }, [highlightedArticleId]);

  return (
    <div>
      <Header
        title="Central de Ajuda"
        subtitle="Como cada área funciona, o que cada botão faz e qual fluxo ele dispara."
        user={user}
        className="contents"
        showSubHeader={false}
      />

      {/* Busca fixa — o Header do hub tem 3rem, então ela encosta logo abaixo. */}
      <div className="sticky top-12 z-20 border-b border-border/60 backdrop-blur-md" data-tour="docs.search">
        <div className="container max-w-7xl py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                // Enter pergunta à IA. Digitar apenas filtra a documentação —
                // é o que impede uma chamada de API a cada tecla.
                if (e.key === "Enter" && query.trim().length >= 5) {
                  e.preventDefault();
                  setAskSubmitCount((c) => c + 1);
                }
              }}
              placeholder={`Buscar ou perguntar sobre a ajuda de ${audience.label.toLowerCase()}…`}
              className="h-12 pl-11 pr-24 text-sm"
              aria-label="Buscar na documentação ou perguntar à IA"
            />
            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
              {isSearching ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Limpar busca"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <kbd className="hidden select-none rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-block">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="container max-w-7xl flex flex-col gap-4 pb-16">
        {/* Seletor de público — some para quem só enxerga a própria doc. */}
        {canSwitchAudience && (
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
              Ver a ajuda de
            </p>
            <div className="flex flex-wrap gap-2">
              {audiences.map((item) => {
                const Icon = ICONS[item.icon] ?? BookOpen;
                const isActive = item.id === audienceId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectAudience(item)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors",
                      isActive
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{audience.description}</p>
          </div>
        )}

        {user.role === "admin" && (
          <Link
            href="/hub/admin/docs/questions"
            className="flex w-fit items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
          >
            <MessageSquare className="size-3.5" />
            Ver o que os usuários estão perguntando
          </Link>
        )}

        <div ref={contentTopRef} className="scroll-mt-32" />

        {isSearching ? (
          /* ── Resultados da busca ── */
          <div className="flex flex-col gap-5">
            {/* A IA vem primeiro: é a resposta direta. Os resultados de texto
                abaixo continuam sendo a fonte verificável. */}
            <DocsAskPanel
              audience={audienceId}
              query={query}
              submitCount={askSubmitCount}
              whatsappNumber={whatsappNumber}
              onOpenArticle={goToArticle}
            />

            <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {results.length === 0
                ? "Nenhum resultado na documentação"
                : `${results.length} ${results.length === 1 ? "resultado" : "resultados"} na documentação`}
            </p>

            {results.length === 0 ? (
              <EmptyResults
                title="Nada encontrado"
                description="Tente outras palavras — a busca cobre títulos, textos, nomes de botões e mensagens do sistema."
              />
            ) : (
              <div className="flex flex-col gap-2">
                {results.map(({ article, section, excerpt }) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => goToArticle(section, article)}
                    className="item group flex flex-col gap-1.5 px-5 py-4 text-left transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        {section.title}
                      </span>
                      <span className="text-sm font-bold tracking-tight group-hover:text-primary">
                        {article.title}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {article.summary}
                    </p>
                    {excerpt && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/70">
                        {excerpt}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
            </div>
          </div>
        ) : (
          /* ── Navegação por seção ── */
          <>
            {/* Sem busca ativa, o painel mostra exemplos de pergunta —
                é o que ensina o usuário a usar bem a ferramenta. */}
            <div data-tour="docs.ask">
              <DocsAskPanel
                audience={audienceId}
                query={query}
                submitCount={askSubmitCount}
                whatsappNumber={whatsappNumber}
                onOpenArticle={goToArticle}
              />
            </div>

          <div className="grid gap-6 lg:grid-cols-[16rem_1fr] lg:items-start">
            {/* Índice lateral */}
            <nav data-tour="docs.sections" className="flex gap-2 overflow-x-auto pb-2 lg:sticky lg:top-32 lg:flex-col lg:overflow-visible lg:pb-0">
              <div className="hidden items-center gap-2 px-2 pb-2 lg:flex">
                <BookOpen className="size-3.5 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                  {totalArticles} artigos
                </span>
              </div>

              {sections.map((section) => {
                const Icon = ICONS[section.icon] ?? BookOpen;
                const isActive = section.id === activeSection.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSectionId(section.id);
                      scrollToContentTop();
                    }}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors lg:w-full",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal">
                      {section.title}
                    </span>
                    <span
                      className={cn(
                        "ml-auto hidden text-[10px] font-black tabular-nums lg:inline",
                        isActive ? "text-primary/60" : "text-muted-foreground/50",
                      )}
                    >
                      {section.articles.length}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Artigos da seção */}
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-black tracking-tight">{activeSection.title}</h2>
                <p className="text-sm text-muted-foreground">{activeSection.description}</p>
              </div>

              {activeSection.articles.map((article) => (
                <article
                  key={article.id}
                  id={`doc-${article.id}`}
                  className={cn(
                    "card scroll-mt-32 overflow-hidden transition-shadow duration-500",
                    highlightedArticleId === article.id && "ring-2 ring-primary/40",
                  )}
                >
                  <div className="flex flex-col gap-2 border-b border-border/50 bg-muted/10 px-6 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-black tracking-tight">{article.title}</h3>
                      {article.route && audienceId === user.role && (
                        <Link
                          href={article.route}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          Abrir tela
                          <ExternalLink className="size-3" />
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{article.summary}</p>
                    {article.keywords && article.keywords.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {article.keywords.slice(0, 6).map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className="h-5 px-2 text-[10px] font-medium text-muted-foreground"
                          >
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-5 px-6 py-6">
                    {article.blocks.map((block, i) => (
                      <DocBlockView key={i} block={block} />
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
          </>
        )}
      </main>
    </div>
  );
}
