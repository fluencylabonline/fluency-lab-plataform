"use client";

import React, { useState, useRef } from "react";
import { 
  Vault, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultBody,
  VaultFooter
} from "@/components/ui/vault";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Upload, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { notify } from "@/components/ui/toaster";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updatePayoutInvoiceAction, updatePayoutReceiptAction } from "../payout.actions";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PayoutDetailsVaultProps {
  payout: {
    id: string;
    amount: number;
    month: number;
    year: number;
    status: "pending" | "completed" | "failed";
    createdAt: Date | string;
    pixKey: string;
    pixKeyType: string;
    externalId: string;
    description?: string | null;
    receiptUrl?: string | null;
    invoiceUrl?: string | null;
    classes?: Array<{
      id: string;
      startAt: Date | string;
      teacherHourlyRate: number | null;
      student?: {
        name: string | null;
      } | null;
    }>;
  };
  teacherId: string;
  isAdmin?: boolean;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function PayoutDetailsVault({
  payout,
  teacherId,
  isAdmin = false,
  onSuccess,
  open,
  onOpenChange,
  trigger
}: PayoutDetailsVaultProps) {
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const monthNames = [
    "janeiro", "fevereiro", "março", "abril", "maio", "junho",
    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
  ];
  const competenceLabel = `${monthNames[payout.month]} de ${payout.year}`;

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Restrict only to PDF as requested
    if (file.type !== "application/pdf") {
      notify.error("Apenas arquivos PDF são permitidos para Nota Fiscal.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploadingInvoice(true);
    const promise = (async () => {
      try {
        // Name file based on competence month & year as requested by the user
        const formattedMonth = String(payout.month + 1).padStart(2, "0");
        const fileName = `nota_fiscal_${payout.year}_${formattedMonth}_${Date.now()}.pdf`;
        const storageRef = ref(storage, `payouts/${teacherId}/invoices/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        const result = await updatePayoutInvoiceAction({
          payoutId: payout.id,
          invoiceUrl: downloadUrl
        });

        if (result?.data?.success) {
          onSuccess?.();
          return "Nota Fiscal anexada com sucesso!";
        } else {
          throw new Error(result?.data?.error || "Erro ao salvar Nota Fiscal no banco.");
        }
      } finally {
        setIsUploadingInvoice(false);
      }
    })();

    notify.promise(promise, {
      loading: "Enviando Nota Fiscal...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro no envio da Nota Fiscal."
    });
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (file.size > 10 * 1024 * 1024) {
      notify.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploadingReceipt(true);
    const promise = (async () => {
      try {
        const fileExt = file.name.split(".").pop();
        const formattedMonth = String(payout.month + 1).padStart(2, "0");
        const fileName = `comprovante_${payout.year}_${formattedMonth}_${Date.now()}.${fileExt}`;
        const storageRef = ref(storage, `payouts/${teacherId}/receipts/${fileName}`);

        await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(storageRef);

        const result = await updatePayoutReceiptAction({
          payoutId: payout.id,
          receiptUrl: downloadUrl
        });

        if (result?.data?.success) {
          onSuccess?.();
          return "Comprovante de pagamento anexado!";
        } else {
          throw new Error(result?.data?.error || "Erro ao salvar comprovante no banco.");
        }
      } finally {
        setIsUploadingReceipt(false);
      }
    })();

    notify.promise(promise, {
      loading: "Enviando Comprovante...",
      success: (msg) => msg,
      error: (err: unknown) => (err as Error).message || "Erro no envio do comprovante."
    });
  };

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Comprovante de Pagamento - FluencyLab</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eaeaea; padding-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .subtitle { font-size: 12px; color: #666; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .field-label { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; }
            .field-value { font-size: 14px; font-weight: bold; margin-top: 2px; }
            .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 10px; border-bottom: 1px solid #eaeaea; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { text-align: left; padding: 8px; font-size: 12px; border-bottom: 1px solid #eee; }
            th { font-weight: bold; color: #666; text-transform: uppercase; font-size: 10px; }
            .amount { font-size: 24px; color: #16a34a; font-weight: 900; }
            .badge { display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: bold; border-radius: 9999px; text-transform: uppercase; }
            .badge-completed { background-color: #dcfce7; color: #15803d; }
            .badge-pending { background-color: #fef9c3; color: #a16207; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eaeaea; padding-top: 15px; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      {trigger}
      <VaultContent className="max-w-2xl sm:max-w-2xl">
        <VaultHeader>
          <VaultTitle>Detalhes do Pagamento</VaultTitle>
        </VaultHeader>
        <VaultBody className="space-y-6">
          
          {/* Main Receipt Content (Printable Area) */}
          <div ref={printAreaRef} className="card p-6 border-border/50 bg-background/50 space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-border/50">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Comprovante de Repasse</p>
                <h4 className="text-lg font-black text-primary uppercase mt-1">FluencyLab</h4>
              </div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-3 py-1 border-none",
                  payout.status === "completed" ? "bg-green-500/10 text-green-500" : 
                  payout.status === "failed" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                )}
              >
                {payout.status === "completed" ? "PAGO" : payout.status === "failed" ? "FALHOU" : "PENDENTE"}
              </Badge>
            </div>

            {/* Receipt Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Valor do Repasse</span>
                <p className="text-2xl font-black text-green-600 mt-0.5">
                  {(payout.amount / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL"
                  })}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Competência Referente</span>
                <p className="text-sm font-black text-foreground capitalize mt-1">
                  {competenceLabel}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Data do Pagamento</span>
                <p className="text-sm font-bold text-foreground mt-1">
                  {format(new Date(payout.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Identificador PIX</span>
                <p className="text-xs font-mono text-muted-foreground break-all mt-1">
                  {payout.externalId}
                </p>
              </div>
              <div className="sm:col-span-2 border-t pt-3 border-border/50">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Chave PIX de Destino</span>
                <p className="text-xs font-black text-foreground mt-1 capitalize">
                  {payout.pixKeyType === "cnpj" ? "CNPJ" : payout.pixKeyType === "cpf" ? "CPF" : payout.pixKeyType === "email" ? "E-mail" : payout.pixKeyType === "phone" ? "Celular" : payout.pixKeyType === "random" ? "Chave Aleatória" : payout.pixKeyType}: <span className="font-mono text-muted-foreground tracking-tight">{payout.pixKey}</span>
                </p>
              </div>
            </div>

            {/* Paid Classes Table */}
            {payout.classes && payout.classes.length > 0 && (
              <div className="border-t pt-4 border-border/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                  Detalhamento de Aulas ({payout.classes.length})
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                        <th className="pb-2 pl-0">Aluno</th>
                        <th className="pb-2">Data/Hora</th>
                        <th className="pb-2 text-right pr-0">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {payout.classes.map((cls) => (
                        <tr key={cls.id} className="text-xs">
                          <td className="py-2 pl-0 font-bold text-foreground">{cls.student?.name || "N/A"}</td>
                          <td className="py-2 text-muted-foreground">
                            {format(new Date(cls.startAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </td>
                          <td className="py-2 text-right pr-0 font-mono font-bold text-foreground">
                            {((cls.teacherHourlyRate ?? payout.amount / (payout.classes?.length || 1)) / 100).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL"
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="footer hidden text-center text-[8px] text-muted-foreground pt-4 border-t border-dashed">
              Comprovante digital emitido automaticamente pela plataforma FluencyLab.
            </div>
          </div>

          {/* Files / Attachments Area (Invoices and Custom receipts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. Nota Fiscal Section (Shared between Teacher and Admin) */}
            <div className="card p-5 border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground">Nota Fiscal</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Documento fiscal emitido pelo professor para a escola referente à competência <strong>{competenceLabel}</strong>.
              </p>

              {payout.invoiceUrl ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <FileText className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-xs font-bold truncate text-foreground">Nota Fiscal PDF</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 border-border/50"
                      onClick={() => window.open(payout.invoiceUrl!, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  {/* Replace Option */}
                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleInvoiceUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                      disabled={isUploadingInvoice}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full text-xs font-bold gap-2 border-border/50" 
                      disabled={isUploadingInvoice}
                    >
                      {isUploadingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Substituir Nota Fiscal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 py-6 text-center">
                    <AlertCircle className="w-5 h-5 text-amber-500 mb-1 opacity-70" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nenhuma nota anexada</span>
                  </div>

                  <div className="relative">
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleInvoiceUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                      disabled={isUploadingInvoice}
                    />
                    <Button 
                      className="w-full text-xs font-bold gap-2 bg-primary/10 text-primary border-none hover:bg-primary/20" 
                      disabled={isUploadingInvoice}
                    >
                      {isUploadingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Enviar Nota Fiscal (PDF)
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Custom Bank Receipt Section (Admin only or viewable by teacher) */}
            <div className="card p-5 border-border/50 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground">Comprovante Bancário</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Comprovante oficial de transferência bancária ou PIX gerado pelo banco da escola.
              </p>

              {payout.receiptUrl ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-lg bg-muted/50 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-xs font-bold truncate text-foreground">Comprovante de Transferência</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 border-border/50"
                      onClick={() => window.open(payout.receiptUrl!, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  {isAdmin && (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={handleReceiptUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                        disabled={isUploadingReceipt}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full text-xs font-bold gap-2 border-border/50" 
                        disabled={isUploadingReceipt}
                      >
                        {isUploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Substituir Comprovante
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 py-6 text-center">
                    <AlertCircle className="w-5 h-5 text-amber-500 mb-1 opacity-70" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Utilizando recibo automático</span>
                  </div>

                  {isAdmin ? (
                    <div className="relative">
                      <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={handleReceiptUpload} 
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                        disabled={isUploadingReceipt}
                      />
                      <Button 
                        className="w-full text-xs font-bold gap-2 bg-primary/10 text-primary border-none hover:bg-primary/20" 
                        disabled={isUploadingReceipt}
                      >
                        {isUploadingReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Anexar Comprovante Bancário
                      </Button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-center text-muted-foreground italic">
                      O comprovante digital gerado acima é o recibo válido para esta operação.
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </VaultBody>
        <VaultFooter className="flex justify-end gap-3 border-t pt-4 border-border/50">
          <Button variant="outline" className="font-bold gap-2 border-border/50" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Imprimir Recibo
          </Button>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
