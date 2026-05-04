"use client";

import { useTranslations, useFormatter } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Download } from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { motion } from "framer-motion";
import { containerVariants, itemVariants } from "@/lib/animations";

export interface PaymentRecord {
  id: string;
  status: string;
  dueDate: Date | string;
  amount: number;
  subscription?: {
    plan?: {
      name: string;
    };
  };
}

interface PaymentHistoryProps {
  initialData: PaymentRecord[];
}

export function PaymentHistory({ initialData }: PaymentHistoryProps) {
  const t = useTranslations("Hub.Payments");
  const router = useRouter();
  const formatIntl = useFormatter();

  const formatCurrency = (val: number) =>
    formatIntl.number(val / 100, {
      style: "currency",
      currency: "BRL",
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-500 bg-green-500/10";
      case "pending":
        return "text-amber-500 bg-amber-500/10";
      case "overdue":
        return "text-red-500 bg-red-500/10";
      case "cancelled":
        return "text-slate-500 bg-slate-500/10";
      default:
        return "text-slate-500 bg-slate-500/10";
    }
  };

  const handleGetInvoice = () => {
    notify.info("A implementar");
  };

  const handleViewReceipt = (id: string) => {
    router.push(`/hub/financial/receipt/${id}`);
  };

  if (initialData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
        <Receipt className="w-12 h-12 mb-4" />
        <p>{t("noPayments")}</p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4"
    >
      {initialData.map((payment) => (
        <motion.div
          key={payment.id}
          variants={itemVariants}
          className="item flex flex-col md:flex-row md:items-center justify-between p-4 gap-4"
        >
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg ${getStatusColor(payment.status)}`}>
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{payment.subscription?.plan?.name || "Plano"}</p>
              <p className="text-sm opacity-60">
                {t("date")}: {formatIntl.dateTime(new Date(payment.dueDate), { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:gap-8">
            <div className="text-right">
              <p className="font-bold">{formatCurrency(payment.amount)}</p>
              <div className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full inline-block ${getStatusColor(payment.status)}`}>
                {t(payment.status)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {payment.status === "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewReceipt(payment.id)}
                  className="h-9 gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("viewReceipt")}</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGetInvoice}
                className="h-9 gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t("getInvoice")}</span>
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
