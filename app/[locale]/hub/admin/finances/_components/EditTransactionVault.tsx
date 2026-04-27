"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Loader2, Paperclip, Trash2, X, Plus } from "lucide-react";
import {
  Vault,
  VaultBody,
  VaultContent,
  VaultField,
  VaultDescription,
  VaultFooter,
  VaultForm,
  VaultHeader,
  VaultIcon,
  VaultInput,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultTitle
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandDialog
} from "@/components/ui/command";
import { createTransactionSchema, type CreateTransactionValues, type Transaction } from "@/modules/finance/finance.schema";
import { updateTransactionAction, deleteTransactionAction, getCategoriesAction } from "@/modules/finance/finance.actions";
import { notify } from "@/components/ui/toaster";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";

interface EditTransactionVaultProps {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionVault({ transaction, open, onOpenChange }: EditTransactionVaultProps) {
  const t = useTranslations("AdminFinances.newTransaction");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { execute: executeUpdate, status: updateStatus } = useAction(updateTransactionAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        notify.success("Transação atualizada!");
        onOpenChange(false);
      } else {
        notify.error(result.data?.error || t("error"));
      }
    },
  });

  const { execute: executeDelete, status: deleteStatus } = useAction(deleteTransactionAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        notify.success("Transação removida!");
        onOpenChange(false);
      } else {
        notify.error(result.data?.error || t("error"));
      }
    },
  });

  const form = useForm<CreateTransactionValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: transaction.type,
      amount: transaction.amount,
      date: new Date(transaction.date),
      description: transaction.description || "",
      status: transaction.status,
      deductible: transaction.deductible || false,
      currency: transaction.currency || "BRL",
      category: transaction.category || "",
      method: transaction.method || "",
      attachmentUrl: transaction.attachmentUrl || "",
    }
  });

  // Re-sync if transaction changes
  useEffect(() => {
    form.reset({
      type: transaction.type,
      amount: transaction.amount,
      date: new Date(transaction.date),
      description: transaction.description || "",
      status: transaction.status,
      deductible: transaction.deductible || false,
      currency: transaction.currency || "BRL",
      category: transaction.category || "",
      method: transaction.method || "",
      attachmentUrl: transaction.attachmentUrl || "",
    });
  }, [transaction, form]);

  useEffect(() => {
    if (open) {
      getCategoriesAction().then((res) => {
        if (res?.data?.success) {
          setCategories(res.data.data || []);
        }
      });
    }
  }, [open]);

  const onSubmit = (values: CreateTransactionValues) => {
    executeUpdate({ id: transaction.id, data: values });
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    executeDelete({ id: transaction.id });
    setIsDeleteDialogOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `finance/attachments/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      form.setValue("attachmentUrl", url);
      notify.success("Anexo enviado!");
    } catch {
      notify.error("Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-xl">
        <VaultHeader>
          <div className="flex items-center justify-between w-full pr-8">
            <VaultTitle>Editar Transação</VaultTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 h-8 w-8"
              onClick={handleDelete}
              disabled={deleteStatus === "executing"}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("type")} error={form.formState.errors.type?.message}>
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) => form.setValue("type", v as "income" | "expense")}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">{t("income")}</SelectItem>
                    <SelectItem value="expense">{t("expense")}</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>

              <VaultField label={t("status")} error={form.formState.errors.status?.message}>
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) => form.setValue("status", v as "paid" | "pending" | "cancelled")}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">{t("paid")}</SelectItem>
                    <SelectItem value="pending">{t("pending")}</SelectItem>
                    <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>
            </div>

            <VaultField label={t("description")} error={form.formState.errors.description?.message}>
              <VaultInput {...form.register("description")} />
            </VaultField>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("amount")} error={form.formState.errors.amount?.message}>
                <VaultInput
                  type="number"
                  step="0.01"
                  defaultValue={transaction.amount / 100}
                  onChange={(e) => {
                    const val = Math.round(parseFloat(e.target.value) * 100);
                    form.setValue("amount", isNaN(val) ? 0 : val);
                  }}
                />
              </VaultField>

              <VaultField label={t("date")} error={form.formState.errors.date?.message}>
                <VaultInput
                  type="date"
                  defaultValue={new Date(transaction.date).toISOString().split("T")[0]}
                  onChange={(e) => form.setValue("date", new Date(e.target.value))}
                />
              </VaultField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("category")} error={form.formState.errors.category?.message}>
                <button
                  type="button"
                  onClick={() => setCategoryOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm cursor-pointer"
                >
                  {form.watch("category") || t("categoryPlaceholder")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>

                <CommandDialog open={categoryOpen} onOpenChange={setCategoryOpen}>
                  <CommandInput
                    placeholder="Buscar ou criar categoria..."
                    value={searchValue}
                    onValueChange={setSearchValue}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {searchValue && (
                        <button
                          type="button"
                          className="flex w-full items-center py-4 px-3 text-sm hover:bg-accent rounded-md transition-colors text-left border-b border-border"
                          onClick={() => {
                            form.setValue("category", searchValue);
                            setCategoryOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          <span>{t("createCategory", { name: searchValue }) || `Criar "${searchValue}"`}</span>
                        </button>
                      )}
                      {!searchValue && "Nenhuma categoria encontrada."}
                    </CommandEmpty>
                    <CommandGroup heading="Sugestões">
                      {categories.map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={(v) => {
                            form.setValue("category", v);
                            setCategoryOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", form.watch("category") === cat ? "opacity-100" : "opacity-0")} />
                          {cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </VaultField>

              <VaultField label={t("method")} error={form.formState.errors.method?.message}>
                <Select
                  value={form.watch("method")}
                  onValueChange={(v) => form.setValue("method", v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">Pix</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="bank_transfer">Transferência</SelectItem>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>
            </div>

            <VaultField label={t("attachment")}>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
                {form.watch("attachmentUrl") ? (
                  <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-accent/50 border border-border w-full">
                    <Paperclip size={14} className="text-primary" />
                    <span className="text-xs truncate flex-1">{t("attachmentLoaded")}</span>
                    <button type="button" onClick={() => form.setValue("attachmentUrl", "")} className="p-1 hover:bg-background rounded-full transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center justify-center w-full h-10 gap-2 border-2 border-dashed border-gray-200/50 rounded-xl hover:bg-muted/50 transition-colors">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="text-sm">{t("attachmentPlaceholder")}</span>
                  </button>
                )}
              </div>
            </VaultField>

            <VaultFooter className="mt-6">
              <VaultSecondaryButton type="button" onClick={() => onOpenChange(false)}>
                {t("cancel")}
              </VaultSecondaryButton>
              <VaultPrimaryButton type="submit" disabled={updateStatus === "executing" || uploading}>
                {updateStatus === "executing" ? t("saving") : t("save")}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
      </Vault>

      <Vault open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <VaultContent className="max-w-sm">
          <VaultHeader>
            <VaultIcon type="delete" />
            <VaultTitle>Excluir Transação</VaultTitle>
            <VaultDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </VaultDescription>
          </VaultHeader>

          <VaultFooter className="mt-6">
            <VaultSecondaryButton onClick={() => setIsDeleteDialogOpen(false)}>
              {t("cancel") || "Cancelar"}
            </VaultSecondaryButton>
            <VaultPrimaryButton variant="destructive" onClick={confirmDelete} disabled={deleteStatus === "executing"}>
              {deleteStatus === "executing" ? t("deleting") || "Excluindo..." : t("confirmDelete") || "Excluir"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </>
  );
}
