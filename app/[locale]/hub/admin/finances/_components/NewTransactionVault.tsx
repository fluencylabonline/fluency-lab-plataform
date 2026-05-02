"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Loader2, Paperclip, Plus, X } from "lucide-react";
import {
  Vault,
  VaultBody,
  VaultContent,
  VaultField,
  VaultFooter,
  VaultForm,
  VaultHeader,
  VaultInput,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultTitle,
  VaultTrigger
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { createTransactionSchema, type CreateTransactionValues } from "@/modules/finance/finance.schema";
import { createTransactionAction, getCategoriesAction } from "@/modules/finance/finance.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import useSWR from "swr";

export function NewTransactionVault() {
  const t = useTranslations("AdminFinances.newTransaction");
  const [open, setOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: categoriesResult } = useSWR(
    open ? "finance-categories" : null,
    () => getCategoriesAction(),
    { revalidateOnFocus: false }
  );

  const categories = categoriesResult?.data?.success ? categoriesResult.data.data || [] : [];

  const { execute, status } = useAction(createTransactionAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        notify.success(t("success"));
        setOpen(false);
        form.reset();
      } else {
        notify.error(result.data?.error || t("error"));
      }
    },
    onError: () => {
      notify.error(t("error"));
    }
  });

  const form = useForm<CreateTransactionValues>({
    resolver: zodResolver(createTransactionSchema),
    defaultValues: {
      type: "expense",
      amount: 0,
      date: new Date(),
      description: "",
      status: "paid",
      deductible: false,
      currency: "BRL",
      category: "",
      method: "",
      attachmentUrl: "",
    }
  });

  const onSubmit = (values: CreateTransactionValues) => {
    execute(values);
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
      notify.success("Anexo enviado com sucesso!");
    } catch (error) {
      console.error("Upload error:", error);
      notify.error("Erro ao enviar anexo");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={setOpen}>
      <VaultTrigger asChild>
        <Button>
          <Plus size={18} className="mr-2" />
          {t("trigger")}
        </Button>
      </VaultTrigger>

      <VaultContent className="max-w-xl">
        <VaultHeader>
          <VaultTitle>{t("title")}</VaultTitle>
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
              <VaultInput
                {...form.register("description")}
                placeholder={t("descriptionPlaceholder")}
              />
            </VaultField>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("amount")} error={form.formState.errors.amount?.message}>
                <VaultInput
                  type="number"
                  step="0.01"
                  onChange={(e) => {
                    const val = Math.round(parseFloat(e.target.value) * 100);
                    form.setValue("amount", isNaN(val) ? 0 : val);
                  }}
                  placeholder="0,00"
                />
              </VaultField>

              <VaultField label={t("date")} error={form.formState.errors.date?.message}>
                <VaultInput
                  type="date"
                  onChange={(e) => form.setValue("date", new Date(e.target.value))}
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </VaultField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("category")} error={form.formState.errors.category?.message}>
                <button
                  type="button"
                  onClick={() => setCategoryOpen(true)}
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
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
                          onSelect={(currentValue) => {
                            form.setValue("category", currentValue);
                            setCategoryOpen(false);
                            setSearchValue("");
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              form.watch("category") === cat ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </CommandDialog>
              </VaultField>

              <VaultField label={t("method") || "Método"} error={form.formState.errors.method?.message}>
                <Select
                  value={form.watch("method")}
                  onValueChange={(v) => form.setValue("method", v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={t("methodPlaceholder")} />
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
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx"
                />
                {form.watch("attachmentUrl") ? (
                  <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-accent/50 border border-border w-full">
                    <Paperclip size={14} className="text-primary" />
                    <span className="text-xs truncate flex-1">{t("attachmentLoaded")}</span>
                    <button
                      type="button"
                      onClick={() => form.setValue("attachmentUrl", "")}
                      className="p-1 hover:bg-background rounded-full transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center justify-center w-full h-10 gap-2 border-2 border-dashed border-gray-200/50 dark:border-gray-700/50 rounded-xl hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    <span className="text-sm">{t("attachmentPlaceholder")}</span>
                  </button>
                )}
              </div>
            </VaultField>

            {form.watch("type") === "expense" && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border">
                <Checkbox
                  id="deductible"
                  checked={form.watch("deductible")}
                  onChange={(e) => form.setValue("deductible", e.target.checked)}
                />
                <label
                  htmlFor="deductible"
                  className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {t("deductibleLabel")}
                </label>
              </div>
            )}

            <VaultFooter className="mt-6">
              <VaultSecondaryButton type="button" onClick={() => setOpen(false)}>
                {t("cancel")}
              </VaultSecondaryButton>
              <VaultPrimaryButton type="submit" disabled={status === "executing" || uploading}>
                {status === "executing" ? t("saving") : t("save")}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
