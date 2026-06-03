"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Plus, CloudDownload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyResults } from "@/components/ui/empty";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultIcon,
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  createNotebookAction,
  getNotebookAction,
} from "@/modules/notebook/notebook.actions";
import type { Notebook } from "@/modules/notebook/notebook.schema";
import { generateNotebookPDF } from "@/lib/pdfGenerator";

interface StudentNotebooksCardProps {
  studentId: string;
  studentName?: string;
  initialNotebooks?: Notebook[];
  isVaultMode?: boolean;
}

export function StudentNotebooksCard({
  studentId,
  studentName = "Estudante",
  initialNotebooks = [],
  isVaultMode = false,
}: StudentNotebooksCardProps) {
  const t = useTranslations("NotebooksCard");
  const params = useParams();
  const locale = params.locale as string;
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>(initialNotebooks);

  const notebooksWithPlainText = useMemo(() => {
    return notebooks.map((nb) => ({
      ...nb,
      plainText: nb.content ? stripHtml(nb.content).toLowerCase() : "",
    }));
  }, [notebooks]);

  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) return notebooksWithPlainText;
    const query = searchQuery.toLowerCase();
    return notebooksWithPlainText.filter((nb) => {
      const titleMatch = nb.title.toLowerCase().includes(query);
      const contentMatch = nb.plainText.includes(query);
      return titleMatch || contentMatch;
    });
  }, [notebooksWithPlainText, searchQuery]);

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) return;
    setIsLoading(true);

    const result = await createNotebookAction({
      title: newNotebookTitle,
      studentId,
    });

    setIsLoading(false);

    if (result?.serverError || !result?.data?.notebook) {
      notify.error(
        result?.serverError || t("errorCreated") || "Erro ao criar notebook.",
      );
      return;
    }

    const created = result.data.notebook;
    setNotebooks((prev) => [created, ...prev]);
    setNewNotebookTitle("");
    setIsVaultOpen(false);
    notify.success(t("successCreated") || "Notebook criado com sucesso!");
    router.push(`/${locale}/notebook/${created.id}`);
  };

  const handleDownloadPDF = async (notebookId: string) => {
    try {
      setIsDownloading(notebookId);
      notify.success(t("successDownload") || "Iniciando download do PDF...");

      const result = await getNotebookAction({ notebookId });

      if (!result?.data?.notebook) {
        throw new Error("Notebook not found");
      }

      await generateNotebookPDF({
        title: result.data.notebook.title,
        studentName,
        content: result.data.notebook.content || "",
        date: result.data.notebook.createdAt,
      });
    } catch (error) {
      console.error("[handleDownloadPDF] Error:", error);
      notify.error("Erro ao gerar PDF.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div
      className={cn(!isVaultMode && "card", "flex flex-col h-full sm:p-4 p-2")}
    >
      {/* Header Sticky */}
      <div
        className={cn(
          "pb-6 sticky top-0 z-10 bg-transparent",
          isVaultMode && "pt-1",
        )}
      >
        {!isVaultMode && (
          <>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {t("title") || "Notebooks"}
              </div>
              <Button size="sm" onClick={() => setIsVaultOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">
                  {t("create") || "Novo"}
                </span>
              </Button>
            </div>
            <SearchBar
              placeholder={t("searchPlaceholder") || "Pesquisar notebooks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </>
        )}

        {isVaultMode && (
          <div className="flex flex-row w-full gap-2 justify-between items-center">
            <SearchBar
              placeholder={t("searchPlaceholder") || "Pesquisar notebooks..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVaultOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-0 pb-4">
        <div className="space-y-2 pr-1">
          {filteredNotebooks.length === 0 ? (
            <EmptyResults
              searchQuery={searchQuery}
              customMessage={{
                withSearch:
                  t("noResultsSearch", { query: searchQuery }) ||
                  `Nenhum resultado para "${searchQuery}"`,
                withoutSearch: t("noResults") || "Nenhum notebook encontrado",
              }}
            />
          ) : (
            filteredNotebooks
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )
              .map((notebook) => (
                <div
                  key={notebook.id}
                  className="item flex items-center justify-between p-4 group"
                >
                  <Link
                    href={`/${locale}/notebook/${notebook.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {highlightText(notebook.title, searchQuery)}
                    </h3>
                    {searchQuery.trim() && notebook.content && stripHtml(notebook.content).toLowerCase().includes(searchQuery.toLowerCase()) && (
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 bg-muted/40 p-1.5 rounded border border-border/45 font-normal select-none">
                        {highlightText(getContentSnippet(notebook.content, searchQuery), searchQuery)}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(notebook.createdAt).toLocaleDateString(
                        locale === "pt" ? "pt-BR" : "en-US",
                      )}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                      disabled={isDownloading === notebook.id}
                      onClick={() => handleDownloadPDF(notebook.id)}
                    >
                      <CloudDownload
                        className={cn(
                          "h-4 w-4",
                          isDownloading === notebook.id && "animate-pulse",
                        )}
                      />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Create Vault */}
      <Vault open={isVaultOpen} onOpenChange={setIsVaultOpen}>
        <VaultContent>
          <VaultHeader>
            <VaultIcon type="confirm" />
            <VaultTitle>{t("createTitle") || "Criar Novo Notebook"}</VaultTitle>
            <VaultDescription>
              {t("createDescription") ||
                "Dê um título para o novo caderno de aula do aluno."}
            </VaultDescription>
          </VaultHeader>

          <VaultBody>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  {t("inputTitle") || "Título do Notebook"}
                </label>
                <Input
                  value={newNotebookTitle}
                  onChange={(e) => setNewNotebookTitle(e.target.value)}
                  placeholder={
                    t("inputPlaceholder") || "Ex: Aula 05 - Business English"
                  }
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreateNotebook()}
                />
              </div>
            </div>
          </VaultBody>

          <VaultFooter>
            <VaultSecondaryButton onClick={() => setIsVaultOpen(false)}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton
              onClick={handleCreateNotebook}
              disabled={!newNotebookTitle.trim() || isLoading}
            >
              {isLoading
                ? t("creating") || "Criando..."
                : t("create") || "Criar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}

function stripHtml(html: string) {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function getContentSnippet(content: string, query: string) {
  const stripped = stripHtml(content);
  if (!query.trim()) return "";
  
  const index = stripped.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return "";

  const start = Math.max(0, index - 40);
  const end = Math.min(stripped.length, index + query.length + 60);
  
  let snippet = stripped.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < stripped.length) snippet = snippet + "...";
  
  return snippet;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-primary/20 text-primary px-0.5 rounded font-semibold">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
