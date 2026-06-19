"use client";

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
import { Calendar, User, BookOpen } from "lucide-react";
import { DetailedForecast } from "@/modules/finance/finance.types";

interface ForecastDetailsTableProps {
  initialData: DetailedForecast;
}

import { ArrowUpCircle, ArrowDownCircle, ReceiptText } from "lucide-react";

export function ForecastDetailsTable({ initialData }: ForecastDetailsTableProps) {
  const t = useTranslations("AdminFinances.forecast");
  const format = useFormatter();

  const { installments, pendingExpenses } = initialData;

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
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
            <ArrowUpCircle size={18} />
          </div>
          <h2 className="text-lg font-bold">{t("pendingRevenue")}</h2>
        </div>

        {installments.length === 0 ? (
          renderEmpty(t("emptyTitle"), t("emptyDescription"))
        ) : (
          <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
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
                {installments.map((tx) => (
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
          </div>
        )}
      </section>

      {/* Despesas Pendentes */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-600">
            <ArrowDownCircle size={18} />
          </div>
          <h2 className="text-lg font-bold">{t("pendingExpenses")}</h2>
        </div>

        {pendingExpenses.length === 0 ? (
          renderEmpty(t("emptyExpensesTitle") || "Nenhuma despesa pendente", t("emptyExpensesDescription") || "Não há despesas com status pendente para este período.")
        ) : (
          <div className="rounded-3xl border border-border/50 bg-card overflow-hidden shadow-sm">
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
                {pendingExpenses.map((tx) => (
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
          </div>
        )}
      </section>
    </div>
  );
}
