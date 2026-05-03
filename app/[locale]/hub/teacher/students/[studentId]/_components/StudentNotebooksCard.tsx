"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  CloudDownload,
  Luggage,
  BookOpen
} from "lucide-react";
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
  VaultIcon
} from "@/components/ui/vault";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notebook {
  id: string;
  title: string;
  createdAt: string;
  student: string;
}

interface StudentNotebooksCardProps {
  studentId: string;
  isVaultMode?: boolean;
}

export function StudentNotebooksCard({ studentId, isVaultMode = false }: StudentNotebooksCardProps) {
  const t = useTranslations("NotebooksCard");
  const params = useParams();
  const locale = params.locale as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data - will be replaced by server data later
  const [notebooks, setNotebooks] = useState<Notebook[]>([
    { id: "1", title: "Aula 01 - Introdução", createdAt: "2024-05-01T10:00:00.000Z", student: studentId },
    { id: "2", title: "Aula 02 - Verbos Irregulares", createdAt: "2024-04-30T10:00:00.000Z", student: studentId },
  ]);

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter(nb =>
      nb.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notebooks, searchQuery]);

  const handleCreateNotebook = async () => {
    if (!newNotebookTitle.trim()) return;
    setIsLoading(true);

    // Mock simulation
    setTimeout(() => {
      const newNb: Notebook = {
        id: Math.random().toString(),
        title: newNotebookTitle,
        createdAt: new Date().toISOString(),
        student: studentId
      };
      setNotebooks([newNb, ...notebooks]);
      setNewNotebookTitle("");
      setIsVaultOpen(false);
      setIsLoading(false);
      notify.success(t("successCreated") || "Notebook criado com sucesso!");
    }, 1000);
  };

  const handleDownloadPDF = () => {
    notify.success(t("successDownload") || "Iniciando download do PDF...");
  };

  const handleAddTask = () => {
    notify.success(t("successTask") || "Tarefa adicionada ao plano!");
  };

  return (
    <div className={cn(
      !isVaultMode && "card",
      "flex flex-col h-full sm:p-4 p-2"
    )}>
      {/* Header Sticky */}
      <div className={cn(
        "pb-6 sticky top-0 z-10 bg-transparent",
        isVaultMode && "pt-1"
      )}>
        {!isVaultMode && (
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {t("title") || "Notebooks"}
            </div>
            <Button
              size="sm"
              onClick={() => setIsVaultOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">{t("create") || "Novo"}</span>
            </Button>
          </div>
        )}

        <SearchBar
          placeholder={t("searchPlaceholder") || "Pesquisar notebooks..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-0 pb-4">
        <div className="space-y-2 pr-1">
          {filteredNotebooks.length === 0 ? (
            <EmptyResults
              searchQuery={searchQuery}
              customMessage={{
                withSearch: t("noResultsSearch", { query: searchQuery }) || `Nenhum resultado para "${searchQuery}"`,
                withoutSearch: t("noResults") || "Nenhum notebook encontrado"
              }}
            />
          ) : (
            filteredNotebooks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((notebook) => (
                <div
                  key={notebook.id}
                  className="item flex items-center justify-between p-4 group"
                >
                  <Link
                    href={`/hub/teacher/students/${studentId}/notebook/${notebook.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {notebook.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(notebook.createdAt).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}
                    </p>
                  </Link>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => handleDownloadPDF()}
                    >
                      <CloudDownload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                      onClick={() => handleAddTask()}
                    >
                      <Luggage className="h-4 w-4" />
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
              {t("createDescription") || "Dê um título para o novo caderno de aula do aluno."}
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
                  placeholder={t("inputPlaceholder") || "Ex: Aula 05 - Business English"}
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
              {isLoading ? t("creating") || "Criando..." : t("create") || "Criar"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}

