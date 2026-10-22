"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface PaginationBarProps {
  /** Página atual, começando em 1. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Números de página com reticências: 1 … 4 5 [6] 7 8 … 20. */
function pageItems(page: number, pageCount: number): Array<number | "gap-start" | "gap-end"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const items: Array<number | "gap-start" | "gap-end"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) items.push("gap-start");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pageCount - 1) items.push("gap-end");
  items.push(pageCount);
  return items;
}

export function PaginationBar({ page, pageSize, total, onPageChange, className }: PaginationBarProps) {
  const t = useTranslations("Pagination");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const button = "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav className={cn("flex flex-wrap items-center justify-between gap-3", className)} aria-label={t("label")}>
      <span className="text-xs font-semibold text-muted-foreground">{t("summary", { from, to, total })}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className={cn(button, "text-foreground/70 hover:bg-muted")}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label={t("previous")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageItems(page, pageCount).map((item) =>
          typeof item === "number" ? (
            <button
              key={item}
              type="button"
              className={cn(button, item === page ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-muted")}
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ) : (
            <span key={item} className="px-1 text-xs text-muted-foreground">…</span>
          )
        )}
        <button
          type="button"
          className={cn(button, "text-foreground/70 hover:bg-muted")}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          aria-label={t("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
