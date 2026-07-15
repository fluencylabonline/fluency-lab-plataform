"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Download, Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Vault,
  VaultBody,
  VaultContent,
  VaultField,
  VaultFooter,
  VaultForm,
  VaultHeader,
  VaultTitle,
  VaultTrigger,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultInput,
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { getTransactionsAction } from "@/modules/finance/finance.actions";

const exportFormSchema = z.object({
  periodType: z.enum(["year", "custom"]),
  year: z.number().int(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  source: z.enum(["all", "student_payments", "teacher_payouts", "manual_income", "manual_expenses"]),
  status: z.enum(["all", "paid", "pending", "cancelled"]),
}).refine((data) => {
  if (data.periodType === "custom") {
    return !!data.startDate && !!data.endDate;
  }
  return true;
}, {
  message: "Datas de início e fim são obrigatórias para período personalizado.",
  path: ["startDate"],
});

type ExportFormValues = z.infer<typeof exportFormSchema>;

export function ExportFinancesVault() {
  const t = useTranslations("AdminFinances.export");
  const tCommon = useTranslations("Common");
  const tSource = useTranslations("AdminFinances.sources");
  const tStatus = useTranslations("AdminFinances.status");

  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: {
      periodType: "year",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
      source: "all",
      status: "all",
    },
  });

  const periodType = form.watch("periodType");

  const { executeAsync } = useAction(getTransactionsAction);

  const onSubmit = async (values: ExportFormValues) => {
    setGenerating(true);
    try {
      let startDateStr: string | undefined;
      let endDateStr: string | undefined;
      let yearVal: number | undefined;

      if (values.periodType === "year") {
        yearVal = values.year;
      } else {
        startDateStr = values.startDate;
        endDateStr = values.endDate;
      }

      // 1. Fetch the filtered data using our Server Action
      const result = await executeAsync({
        status: values.status,
        source: values.source,
        year: yearVal,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
      });

      if (!result?.data?.success) {
        notify.error(result?.data?.error || t("error"));
        return;
      }

      const transactions = result.data.data || [];

      if (transactions.length === 0) {
        notify.error("Nenhuma transação encontrada para o período e filtros selecionados.");
        return;
      }

      // 2. Format columns nicely for Excel (Portuguese columns for Brazilian accountant compatibility)
      const formattedData = transactions.map((item) => {
        // Formatar data
        const itemDate = new Date(item.date);
        const dataFormatada = itemDate.toLocaleDateString("pt-BR");

        // Traduzir Tipo
        const tipoFormatado = item.type === "income" ? "Receita" : "Despesa";

        // Traduzir Status
        let statusFormatado = "Outro";
        if (item.status === "paid") statusFormatado = "Pago";
        else if (item.status === "pending") statusFormatado = "Pendente";
        else if (item.status === "cancelled") statusFormatado = "Cancelado";

        // Traduzir Origem
        let origemFormatada = "Manual";
        if (item.source === "student_payment") origemFormatada = "Mensalidade de Aluno";
        else if (item.source === "teacher_payout") origemFormatada = "Repasse de Professor";

        // Traduzir Método de Pagamento
        let metodoFormatado = item.method || "-";
        if (item.method === "pix") metodoFormatado = "Pix";
        else if (item.method === "credit_card") metodoFormatado = "Cartão de Crédito";
        else if (item.method === "bank_transfer") metodoFormatado = "Transferência";
        else if (item.method === "cash") metodoFormatado = "Dinheiro";

        return {
          "Data": dataFormatada,
          "Descrição": item.description || "",
          "Categoria": item.category || "Outros",
          "Tipo": tipoFormatado,
          "Valor (R$)": item.amount / 100, // número decimal puro para que o Excel possa somar/fazer fórmulas
          "Status": statusFormatado,
          "Método": metodoFormatado,
          "Origem": origemFormatada,
          "Dedutível (Fins Fiscais)": item.type === "expense" ? (item.deductible ? "Sim" : "Não") : "N/A",
        };
      });

      // 3. Dynamically import xlsx (SheetJS) to optimize bundle size
      const XLSX = await import("xlsx");

      // 4. Generate worksheet
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Finanças");

      // Auto-fit column widths
      const cols = Object.keys(formattedData[0] || {}).map((key) => {
        let maxLen = key.length;
        for (const row of formattedData) {
          const val = String(row[key as keyof typeof row] || "");
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        }
        return { wch: maxLen + 3 };
      });
      ws["!cols"] = cols;

      // 5. Trigger client-side browser download
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const fileBlob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const filename = `relatorio_financeiro_${
        values.periodType === "year"
          ? values.year
          : `${values.startDate}_a_${values.endDate}`
      }.xlsx`;

      const downloadUrl = URL.createObjectURL(fileBlob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      notify.success(t("success"));
      setOpen(false);
    } catch (error) {
      console.error("[ExportFinances] Export error:", error);
      notify.error(t("error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={setOpen}>
      <VaultTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download size={18} className="mr-2" />
          <span>{t("trigger")}</span>
        </Button>
      </VaultTrigger>

      <VaultContent className="max-w-md">
        <VaultHeader>
          <VaultTitle>{t("title")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={form.handleSubmit(onSubmit)}>
            {/* Tipo de Período */}
            <VaultField label={t("periodType")}>
              <Controller
                name="periodType"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">{t("fullYear")}</SelectItem>
                      <SelectItem value="custom">{t("customPeriod")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </VaultField>

            {/* Ano de Referência (Ano Inteiro) */}
            {periodType === "year" && (
              <VaultField label={t("year")}>
                <Controller
                  name="year"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value.toString()}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y} value={y.toString()}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </VaultField>
            )}

            {/* Datas Customizadas */}
            {periodType === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <VaultField
                  label={t("startDate")}
                  error={form.formState.errors.startDate?.message}
                >
                  <VaultInput
                    type="date"
                    {...form.register("startDate")}
                    required
                  />
                </VaultField>

                <VaultField label={t("endDate")}>
                  <VaultInput
                    type="date"
                    {...form.register("endDate")}
                    required
                  />
                </VaultField>
              </div>
            )}

            {/* Origem */}
            <VaultField label={t("source")}>
              <Controller
                name="source"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tSource("all")}</SelectItem>
                      <SelectItem value="student_payments">
                        {tSource("student_payments")}
                      </SelectItem>
                      <SelectItem value="teacher_payouts">
                        {tSource("teacher_payouts")}
                      </SelectItem>
                      <SelectItem value="manual_income">
                        {tSource("manual_income")}
                      </SelectItem>
                      <SelectItem value="manual_expenses">
                        {tSource("manual_expenses")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </VaultField>

            {/* Status */}
            <VaultField label={t("status")}>
              <Controller
                name="status"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tStatus("all")}</SelectItem>
                      <SelectItem value="paid">{tStatus("paid")}</SelectItem>
                      <SelectItem value="pending">{tStatus("pending")}</SelectItem>
                      <SelectItem value="cancelled">
                        {tStatus("cancelled")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </VaultField>

            <VaultFooter className="mt-6">
              <VaultSecondaryButton
                type="button"
                onClick={() => setOpen(false)}
                disabled={generating}
              >
                {tCommon("cancel")}
              </VaultSecondaryButton>
              <VaultPrimaryButton type="submit" disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("loading")}
                  </>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    {t("submit")}
                  </>
                )}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
