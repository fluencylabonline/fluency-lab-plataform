"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useFormatter } from "next-intl";
import { ArrowDownCircle, ArrowUpCircle, Tag, Paperclip, CreditCard, Banknote, QrCode, Building2, Wallet, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyResults } from "@/components/ui/empty";
import { useState } from "react";
import { EditTransactionVault } from "./EditTransactionVault";
import { Button } from "@/components/ui/button";
import { Transaction } from "@/modules/finance/finance.schema";
import { UnifiedTransaction } from "@/modules/finance/finance.types";

interface TransactionsTableProps {
  transactions: UnifiedTransaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const t = useTranslations("AdminFinances.transactions");
  const format = useFormatter();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  if (transactions.length === 0) {
    return (
      <div className="py-12">
        <EmptyResults
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const startIndex = (activePage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[100px]">{t("date")}</TableHead>
            <TableHead>{t("description")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("method")}</TableHead>
            <TableHead className="text-right">{t("amount")}</TableHead>
            <TableHead className="w-[80px] text-center">{t("status.label")}</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedTransactions.map((tx) => (
            <TableRow 
              key={tx.id} 
              className={cn(
                "group hover:bg-muted/20 transition-colors",
                tx.source === "manual" && "cursor-pointer"
              )}
              onClick={() => {
                if (tx.source === "manual") {
                  setSelectedTransaction(tx as unknown as Transaction);
                }
              }}
            >
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                {format.dateTime(new Date(tx.date), { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-full",
                    tx.type === "income" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                  )}>
                    {tx.type === "income" ? <ArrowUpCircle size={14} /> : <ArrowDownCircle size={14} />}
                  </div>
                  <span className="font-medium text-sm line-clamp-1">{tx.description}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Tag size={12} className="opacity-50" />
                  <span>{tx.category || "---"}</span>
                  {tx.deductible && (
                    <Badge variant="outline" className="text-[10px] py-0 px-1 border-blue-500/30 text-blue-600 bg-blue-50">
                      {t("deductible")}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {tx.method === "pix" && <QrCode size={12} className="opacity-70" />}
                  {tx.method === "credit_card" && <CreditCard size={12} className="opacity-70" />}
                  {tx.method === "bank_transfer" && <Building2 size={12} className="opacity-70" />}
                  {tx.method === "cash" && <Banknote size={12} className="opacity-70" />}
                  {(!tx.method || tx.method === "other") && <Wallet size={12} className="opacity-70" />}
                  <span>{tx.method ? t(`methods.${tx.method}`) : "---"}</span>
                </div>
              </TableCell>
              <TableCell className={cn(
                "text-right font-semibold text-sm",
                tx.type === "income" ? "text-emerald-600" : "text-foreground"
              )}>
                {tx.type === "income" ? "+" : "-"} {format.number(tx.amount / 100, { style: 'currency', currency: tx.currency || 'BRL' })}
              </TableCell>
              <TableCell>
                <div className="flex justify-center">
                  <Badge
                    variant={tx.status === "paid" ? "secondary" : tx.status === "pending" ? "outline" : "destructive"}
                    className={cn(
                      "text-[10px] capitalize",
                      tx.status === "paid" && "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      tx.status === "pending" && "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    )}
                  >
                    {t(`status.${tx.status}`)}
                  </Badge>
                </div>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {tx.attachmentUrl && (
                  <a 
                    href={tx.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-muted rounded-full transition-colors inline-block text-muted-foreground hover:text-primary"
                  >
                    <Paperclip size={14} />
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-4 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {startIndex + 1}–{Math.min(startIndex + itemsPerPage, transactions.length)}{" "}
            <span className="text-muted-foreground/50">/ {transactions.length}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={activePage === 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={activePage === page ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7 text-xs"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={activePage === totalPages}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
      
      {selectedTransaction && (
        <EditTransactionVault 
          transaction={selectedTransaction} 
          open={!!selectedTransaction} 
          onOpenChange={(open) => !open && setSelectedTransaction(null)} 
        />
      )}
    </>
  );
}
