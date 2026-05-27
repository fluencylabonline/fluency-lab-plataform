"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  Mail,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ContractTemplate, type ContractInstance } from "@/modules/contract/contract.schema";

interface ContractInstanceExtended extends ContractInstance {
  template: ContractTemplate;
  user: {
    name: string;
    email: string;
  };
}

interface ContractInstancesTabProps {
  instances: ContractInstanceExtended[];
  actionLoadingId: string | null;
  onDownload: (instanceId: string) => void;
  onResendEmail: (instanceId: string) => void;
}

export function ContractInstancesTab({
  instances,
  actionLoadingId,
  onDownload,
  onResendEmail,
}: ContractInstancesTabProps) {
  const t = useTranslations("Contracts");

  // Helper formatting status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "signed":
        return <Badge variant="success">{t("status.signed") || "Assinado"}</Badge>;
      case "pending":
        return <Badge variant="warning">{t("status.pending") || "Pendente"}</Badge>;
      case "cancelled":
        return <Badge variant="destructive">{t("status.cancelled") || "Cancelado"}</Badge>;
      case "expired":
        return <Badge variant="outline">{t("status.expired") || "Expirado"}</Badge>;
      default:
        return <Badge variant="ghost">{status}</Badge>;
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {t("instances.title") || "Contratos Gerados & Assinados"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {instances.length} {instances.length === 1 ? "registro encontrado" : "registros encontrados"}
        </span>
      </div>

      {instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {t("instances.empty") || "Nenhum contrato gerado ou assinado."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("instances.emptyDesc") || "As assinaturas dos usuários serão listadas aqui conforme o fluxo do sistema."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop view (Table) */}
          <div className="hidden md:block relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("instances.user") || "Usuário"}</TableHead>
                  <TableHead>{t("instances.template") || "Template"}</TableHead>
                  <TableHead>{t("instances.status") || "Status"}</TableHead>
                  <TableHead>{t("instances.createdAt") || "Gerado em"}</TableHead>
                  <TableHead>{t("instances.signedAt") || "Assinado em"}</TableHead>
                  <TableHead className="text-right">{t("instances.actions") || "Ações"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instances.map((instance) => (
                  <TableRow key={instance.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {instance.user?.name || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {instance.user?.email || ""}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {instance.template?.name || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          v{instance.template?.version || "1"} ({instance.template?.region || "BR"})
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(instance.status)}</TableCell>
                    <TableCell className="text-xs">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(instance.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {instance.signedAt ? (
                        <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {new Date(instance.signedAt).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {t("status.awaiting") || "Pendente"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {instance.status === "signed" && instance.pdfUrl && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload(instance.id)}
                              isLoading={actionLoadingId === instance.id}
                              title={t("actions.download") || "Baixar PDF"}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onResendEmail(instance.id)}
                              isLoading={actionLoadingId === instance.id}
                              title={t("actions.resendEmail") || "Reenviar Contrato"}
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {instance.pdfUrl && (
                          <a
                            href={`/verify/${instance.integrityHash || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                            title={t("actions.verify") || "Verificar Assinatura"}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view (Cards) */}
          <div className="block md:hidden space-y-3">
            {instances.map((instance) => (
              <div key={instance.id} className="item p-4 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight">
                      {instance.user?.name || "N/A"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {instance.user?.email || ""}
                    </p>
                  </div>
                  <div className="shrink-0">{getStatusBadge(instance.status)}</div>
                </div>

                <div className="space-y-2.5 border-t border-gray-100 dark:border-gray-900 pt-3 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-medium">DOCUMENTO / MODELO:</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {instance.template?.name || "N/A"}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      v{instance.template?.version || "1"} ({instance.template?.region || "BR"})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-gray-50 dark:border-gray-950 pt-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">GERADO EM:</span>
                      <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(instance.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400 font-medium">ASSINADO EM:</span>
                      {instance.signedAt ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {new Date(instance.signedAt).toLocaleDateString("pt-BR")}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-muted-foreground font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {t("status.awaiting") || "Pendente"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {instance.pdfUrl && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-900">
                    <a
                      href={`/verify/${instance.integrityHash || ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 justify-center px-3 h-9 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-muted rounded-md transition-colors border border-gray-200 dark:border-gray-800"
                      title={t("actions.verify") || "Verificar Assinatura"}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Verificar</span>
                    </a>
                    {instance.status === "signed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResendEmail(instance.id)}
                          isLoading={actionLoadingId === instance.id}
                          className="text-xs h-9"
                          leftIcon={<Mail className="w-3.5 h-3.5" />}
                        >
                          E-mail
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDownload(instance.id)}
                          isLoading={actionLoadingId === instance.id}
                          className="text-xs h-9"
                          leftIcon={<Download className="w-3.5 h-3.5" />}
                        >
                          PDF
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
