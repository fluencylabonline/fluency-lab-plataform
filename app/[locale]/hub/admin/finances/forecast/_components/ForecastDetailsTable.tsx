"use client";

import { useState } from "react";
import { useTranslations, useFormatter } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { DetailedForecast } from "@/modules/finance/finance.types";

interface ForecastDetailsTableProps {
  initialData: DetailedForecast;
}

import { ArrowUpCircle, ArrowDownCircle, ReceiptText } from "lucide-react";

const ITEMS_PER_PAGE = 10;

function usePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (activePage - 1) * ITEMS_PER_PAGE;
  const paginated = items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  return { currentPage: activePage, setCurrentPage, totalPages, startIndex, paginated };
}

function PaginationFooter({
  startIndex,
  pageSize,
  total,
  totalPages,
  currentPage,
  onPageChange,
}: {
  startIndex: number;
  pageSize: number;
  total: number;
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {startIndex + 1}–{Math.min(startIndex + pageSize, total)}{" "}
        <span className="text-muted-foreground/50">/ {total}</span>
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "secondary" : "ghost"}
            size="icon"
            className="h-7 w-7 text-xs"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ForecastDetailsTable({ initialData }: ForecastDetailsTableProps) {
  const t = useTranslations("AdminFinances.forecast");
  const format = useFormatter();

  const { installments, pendingExpenses } = initialData;

  const installmentsPagination = usePagination(installments);
  const expensesPagination = usePagination(pendingExpenses);

  const renderEmpty = (title: string, description: string) => (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-muted/20">
      <div className="p-4 rounded-full bg-muted/50 mb-4">
        <Calendar size={32} className="text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {description}
      </p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Receitas Projetadas */}
      <section className="space-y-4" data-tour="admin-forecast.revenue">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <ArrowUpCircle size={18} />
            </div>
            <h2 className="text-lg font-bold">{t("pendingRevenue")}</h2>
          </div>
          {installments.length > 0 && (
            <span className="text-xs text-muted-foreground">{installments.length} {t("items")}</span>
          )}
        </div>

        {installments.length === 0 ? (
          renderEmpty(t("emptyTitle"), t("emptyDescription"))
        ) : (
          <>
          <div className="hidden md:block rounded-md border border-border/50 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[250px]">{t("student")}</TableHead>
                  <TableHead>{t("plan")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installmentsPagination.paginated.map((tx) => (
                  <TableRow key={tx.id} className="border-border/40 transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10 text-primary">
                          <User size={14} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold truncate max-w-[180px]">
                            {tx.subscription?.student?.name || "N/A"}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            {t("installment")} {tx.orderIndex}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen size={14} />
                        <span>{tx.subscription?.plan?.name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {format.dateTime(new Date(tx.dueDate), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {format.number(tx.amount / 100, { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationFooter
              startIndex={installmentsPagination.startIndex}
              pageSize={ITEMS_PER_PAGE}
              total={installments.length}
              totalPages={installmentsPagination.totalPages}
              currentPage={installmentsPagination.currentPage}
              onPageChange={installmentsPagination.setCurrentPage}
            />
          </div>

          <div className="block md:hidden space-y-3">
            {installmentsPagination.paginated.map((tx) => (
              <div key={tx.id} className="item p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                      <User size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate">
                        {tx.subscription?.student?.name || "N/A"}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {t("installment")} {tx.orderIndex}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 font-bold text-sm text-emerald-600">
                    {format.number(tx.amount / 100, { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BookOpen size={12} className="opacity-70 shrink-0" />
                    <span className="truncate">{tx.subscription?.plan?.name || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={12} className="opacity-70" />
                    <span>
                      {format.dateTime(new Date(tx.dueDate), {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-md border border-border/50 bg-card overflow-hidden">
              <PaginationFooter
                startIndex={installmentsPagination.startIndex}
                pageSize={ITEMS_PER_PAGE}
                total={installments.length}
                totalPages={installmentsPagination.totalPages}
                currentPage={installmentsPagination.currentPage}
                onPageChange={installmentsPagination.setCurrentPage}
              />
            </div>
          </div>
          </>
        )}
      </section>

      {/* Despesas Pendentes */}
      <section className="space-y-4" data-tour="admin-forecast.expenses">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
              <ArrowDownCircle size={18} />
            </div>
            <h2 className="text-lg font-bold">{t("pendingExpenses")}</h2>
          </div>
          {pendingExpenses.length > 0 && (
            <span className="text-xs text-muted-foreground">{pendingExpenses.length} {t("items")}</span>
          )}
        </div>

        {pendingExpenses.length === 0 ? (
          renderEmpty(t("emptyExpensesTitle") || "Nenhuma despesa pendente", t("emptyExpensesDescription") || "Não há despesas com status pendente para este período.")
        ) : (
          <>
          <div className="hidden md:block rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[250px]">{t("description")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("dueDate")}</TableHead>
                  <TableHead className="text-right">{t("amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expensesPagination.paginated.map((tx) => (
                  <TableRow key={tx.id} className="border-border/40 transition-colors hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-rose-500/10 text-rose-600">
                          <ReceiptText size={14} />
                        </div>
                        <span className="text-sm font-semibold truncate max-w-[180px]">
                          {tx.description}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wider">
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {format.dateTime(new Date(tx.date), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          timeZone: 'UTC'
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-rose-600">
                      {format.number(tx.amount / 100, { style: 'currency', currency: 'BRL' })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <PaginationFooter
              startIndex={expensesPagination.startIndex}
              pageSize={ITEMS_PER_PAGE}
              total={pendingExpenses.length}
              totalPages={expensesPagination.totalPages}
              currentPage={expensesPagination.currentPage}
              onPageChange={expensesPagination.setCurrentPage}
            />
          </div>

          <div className="block md:hidden space-y-3">
            {expensesPagination.paginated.map((tx) => (
              <div key={tx.id} className="item p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-rose-500/10 text-rose-600 shrink-0">
                      <ReceiptText size={14} />
                    </div>
                    <span className="text-sm font-semibold truncate">
                      {tx.description}
                    </span>
                  </div>
                  <span className="shrink-0 font-bold text-sm text-rose-600">
                    {format.number(tx.amount / 100, { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wider">
                    {tx.category}
                  </Badge>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={12} className="opacity-70" />
                    <span>
                      {format.dateTime(new Date(tx.date), {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        timeZone: 'UTC'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-md border border-border/50 bg-card overflow-hidden">
              <PaginationFooter
                startIndex={expensesPagination.startIndex}
                pageSize={ITEMS_PER_PAGE}
                total={pendingExpenses.length}
                totalPages={expensesPagination.totalPages}
                currentPage={expensesPagination.currentPage}
                onPageChange={expensesPagination.setCurrentPage}
              />
            </div>
          </div>
          </>
        )}
      </section>
    </div>
  );
}
