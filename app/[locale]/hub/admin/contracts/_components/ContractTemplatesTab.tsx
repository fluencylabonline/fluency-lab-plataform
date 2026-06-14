"use client";

import { useTranslations } from "next-intl";
import { FileText, Globe, Eye, Check, Trash2 } from "lucide-react";
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
import { type ContractTemplate } from "@/modules/contract/contract.schema";

interface ContractTemplatesTabProps {
  templates: ContractTemplate[];
  actionLoadingId?: string | null;
  onView: (template: ContractTemplate) => void;
  onCreateNew: () => void;
  onActivate?: (templateId: string) => void;
  onDelete?: (template: ContractTemplate) => void;
}

export function ContractTemplatesTab({
  templates,
  actionLoadingId,
  onView,
  onCreateNew,
  onActivate,
  onDelete,
}: ContractTemplatesTabProps) {
  const t = useTranslations("Contracts");

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {t("templates.listTitle") || "Templates Disponíveis"}
        </h3>
        <span className="text-xs text-muted-foreground">
          {templates.length} {templates.length === 1 ? "modelo encontrado" : "modelos encontrados"}
        </span>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-base font-semibold text-gray-700 dark:text-gray-300">
            {t("templates.empty") || "Nenhum modelo de contrato cadastrado."}
          </p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            {t("templates.emptyDesc") || "Crie um novo modelo para habilitar as assinaturas automáticas."}
          </p>
          <Button onClick={onCreateNew}>
            {t("createTemplate") || "Criar Template"}
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop view (Table) */}
          <div className="hidden md:block relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("templates.name") || "Nome do Documento"}</TableHead>
                  <TableHead>{t("templates.region") || "Região"}</TableHead>
                  <TableHead>{t("templates.type") || "Destinatário"}</TableHead>
                  <TableHead>{t("templates.partyType") || "Tipo de Assinatura"}</TableHead>
                  <TableHead className="text-center">{t("templates.version") || "Versão"}</TableHead>
                  <TableHead className="text-center">{t("templates.status") || "Status"}</TableHead>
                  <TableHead className="text-right">{t("templates.actions") || "Ações"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                      {template.name}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 capitalize">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                        {template.region}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize">
                          {template.type === "student" ? "Aluno" : "Professor"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {template.type === "student" 
                            ? "Duração: Plano" 
                            : `Duração: ${template.durationMonths || 6} meses`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-xs font-medium bg-muted px-2.5 py-1 rounded">
                        {template.partyType === "individual" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-mono text-xs">
                      v{template.version}
                    </TableCell>
                    <TableCell className="text-center">
                      {template.isActive ? (
                        <Badge variant="success">{t("templates.active") || "Ativo"}</Badge>
                      ) : (
                        <Badge variant="ghost">{t("templates.inactive") || "Inativo"}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(template)}
                          title={t("actions.view") || "Visualizar Modelo"}
                          disabled={actionLoadingId === template.id}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {!template.isActive && onActivate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onActivate(template.id)}
                            title={t("actions.activate") || "Ativar Modelo"}
                            disabled={actionLoadingId === template.id}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}

                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(template)}
                            title={t("actions.delete") || "Excluir Modelo"}
                            disabled={actionLoadingId === template.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view (Cards in layout container) */}
          <div className="block md:hidden space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="item p-4 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight">
                      {template.name}
                    </h4>
                    <span className="text-xs text-muted-foreground font-mono mt-1 block">
                      Versão v{template.version}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {template.isActive ? (
                      <Badge variant="success">{t("templates.active") || "Ativo"}</Badge>
                    ) : (
                      <Badge variant="ghost">{t("templates.inactive") || "Inativo"}</Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs border-t border-gray-100 dark:border-gray-900 pt-3">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium text-gray-400 mr-1">Região:</span>
                      <span className="capitalize font-semibold">{template.region}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium text-gray-400 mr-1">Destinatário:</span>
                      <span className="font-semibold">
                        {template.type === "student" 
                          ? "Aluno (Vigência do plano)" 
                          : `Professor (${template.durationMonths || 6} meses)`}
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium text-gray-400 mr-1">Tipo de Assinatura:</span>
                      <span className="font-medium px-2 py-0.5 bg-muted rounded text-[10px]">
                        {template.partyType === "individual" ? "Pessoa Física (PF)" : "Pessoa Jurídica (PJ)"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-900">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onView(template)}
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                    disabled={actionLoadingId === template.id}
                  >
                    {t("actions.view") || "Visualizar"}
                  </Button>

                  {!template.isActive && onActivate && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900/30 dark:text-green-400 dark:hover:bg-green-950/20"
                      onClick={() => onActivate(template.id)}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                      disabled={actionLoadingId === template.id}
                    >
                      {t("actions.activate") || "Ativar"}
                    </Button>
                  )}

                  {onDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/20"
                      onClick={() => onDelete(template)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      disabled={actionLoadingId === template.id}
                    >
                      {t("actions.delete") || "Excluir"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
