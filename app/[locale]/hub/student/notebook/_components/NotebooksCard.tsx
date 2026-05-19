"use client";

import { useState, useMemo } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  CloudDownload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { EmptyResults } from "@/components/ui/empty";
import { notify } from "@/components/ui/toaster";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { getNotebookAction } from "@/modules/notebook/notebook.actions";
import { generateNotebookPDF } from "@/lib/pdfGenerator";
import type { Notebook } from "@/modules/notebook/notebook.schema";

interface NotebooksCardProps {
  isVaultMode?: boolean;
  initialNotebooks?: Notebook[];
  studentName?: string;
}

export function NotebooksCard({
  isVaultMode = false,
  initialNotebooks = [],
  studentName = "Estudante"
}: NotebooksCardProps) {
  const t = useTranslations("NotebooksCard");
  const formatIntl = useFormatter();

  const [searchQuery, setSearchQuery] = useState("");
  const [notebooks] = useState<Notebook[]>(initialNotebooks);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter(nb =>
      nb.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [notebooks, searchQuery]);

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
        date: result.data.notebook.createdAt
      });
    } catch (error) {
      console.error("[handleDownloadPDF] Error:", error);
      notify.error("Erro ao gerar PDF.");
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className={cn(
      !isVaultMode && "card",
      "w-full flex flex-col h-full sm:p-4 p-2"
    )}>
      {/* Header Sticky */}
      <div className={cn(
        "pb-6 sticky top-0 z-10 bg-transparent",
        isVaultMode && "pt-1"
      )}>
        <SearchBar
          placeholder={t("searchPlaceholder")}
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
                withSearch: t("noResultsSearch", { query: searchQuery }),
                withoutSearch: t("noResults")
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
                    href={`/notebook/${notebook.id}`}
                    className="flex-1 min-w-0"
                  >
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {notebook.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {formatIntl.dateTime(new Date(notebook.createdAt), { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                      <CloudDownload className={cn("h-4 w-4", isDownloading === notebook.id && "animate-pulse")} />
                    </Button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
