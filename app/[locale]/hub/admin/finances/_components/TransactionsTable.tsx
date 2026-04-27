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
import { ArrowDownCircle, ArrowUpCircle, Tag, Paperclip, CreditCard, Banknote, QrCode, Building2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyResults } from "@/components/ui/empty";
import { useState } from "react";
import { EditTransactionVault } from "./EditTransactionVault";
import { Transaction } from "@/modules/finance/finance.schema";

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const t = useTranslations("AdminFinances.transactions");
  const format = useFormatter();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

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
          {transactions.map((tx) => (
            <TableRow 
              key={tx.id} 
              className="group hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => setSelectedTransaction(tx)}
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
