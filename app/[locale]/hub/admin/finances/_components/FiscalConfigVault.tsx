"use client";

import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { useTranslations } from "next-intl";
import { Settings, Plus, Trash2 } from "lucide-react";
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
import { upsertFiscalConfigSchema, type UpsertFiscalConfigValues, type FiscalConfig } from "@/modules/finance/finance.schema";
import { upsertFiscalConfigAction, getFiscalConfigAction } from "@/modules/finance/finance.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface FiscalConfigVaultProps {
  initialConfig: FiscalConfig | null;
  year: number;
}

const ANNUAL_IRPF_DEFAULTS = [
  { min: 0, max: 2855970, rate: 0, deduction: 0 },
  { min: 2855971, max: 3391980, rate: 7.5, deduction: 214198 },
  { min: 3391981, max: 4501200, rate: 15, deduction: 468597 },
  { min: 4501201, max: 5597616, rate: 22.5, deduction: 806187 },
  { min: 5597617, max: null, rate: 27.5, deduction: 1086068 },
];

export function FiscalConfigVault({ initialConfig, year }: FiscalConfigVaultProps) {
  const t = useTranslations("AdminFinances.fiscalConfig");
  const [open, setOpen] = useState(false);

  const { execute: saveConfig, status: saveStatus } = useAction(upsertFiscalConfigAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        notify.success(t("success"));
        setOpen(false);
      } else {
        notify.error(result.data?.error || t("error"));
      }
    },
    onError: () => {
      notify.error(t("error"));
    }
  });

  const form = useForm<UpsertFiscalConfigValues>({
    resolver: zodResolver(upsertFiscalConfigSchema),
    defaultValues: {
      year,
      meiExemptPercentage: initialConfig?.meiExemptPercentage ?? 32,
      irpfRanges: initialConfig?.irpfRanges ?? ANNUAL_IRPF_DEFAULTS
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "irpfRanges"
  });

  const { execute: fetchConfig, status: fetchStatus } = useAction(getFiscalConfigAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        const config = result.data.data;
        if (config) {
          form.setValue("meiExemptPercentage", config.meiExemptPercentage);
          replace(config.irpfRanges);
        } else {
          // Reset to defaults if no config found for that year
          form.setValue("meiExemptPercentage", 32);
          replace(ANNUAL_IRPF_DEFAULTS);
        }
      }
    }
  });

  const watchedYear = useWatch({ control: form.control, name: "year" });

  useEffect(() => {
    if (open && watchedYear && watchedYear >= 2000 && watchedYear <= 2100) {
      // Debounce or just fetch if it's a valid year change
      const timer = setTimeout(() => {
        fetchConfig({ year: watchedYear });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [watchedYear, open, fetchConfig]);

  const onSubmit = (values: UpsertFiscalConfigValues) => {
    saveConfig(values);
  };

  return (
    <Vault open={open} onOpenChange={setOpen}>
      <VaultTrigger asChild>
        <Button variant="outline" className="h-10 px-4">
          <Settings size={18} className="mr-2" />
          {t("trigger")}
        </Button>
      </VaultTrigger>

      <VaultContent className="sm:max-w-2xl">
        <VaultHeader>
          <VaultTitle>{t("title")}</VaultTitle>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <VaultField label={t("yearLabel")} error={form.formState.errors.year?.message}>
                <div className="relative">
                  <VaultInput 
                    type="number"
                    {...form.register("year", { valueAsNumber: true })} 
                    className="w-full"
                  />
                  {fetchStatus === "executing" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </VaultField>

              <VaultField label={t("meiExemptLabel")} error={form.formState.errors.meiExemptPercentage?.message}>
                <div className="flex items-center gap-2">
                  <VaultInput 
                    type="number"
                    {...form.register("meiExemptPercentage", { valueAsNumber: true })} 
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </VaultField>
            </div>
            <p className="text-[11px] text-muted-foreground mb-4">{t("meiExemptHelp")}</p>

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("irpfTableTitle")}
                </h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => append({ min: 0, max: null, rate: 0, deduction: 0 })}
                  className="h-8 text-primary"
                >
                  <Plus size={14} className="mr-1" />
                  {t("addRange")}
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end p-3 rounded-xl bg-muted/20 border border-border/50 relative group">
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Min (R$)</label>
                      <VaultInput 
                        type="number"
                        step="0.01"
                        defaultValue={field.min / 100}
                        onChange={(e) => form.setValue(`irpfRanges.${index}.min`, Math.round(parseFloat(e.target.value) * 100))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Max (R$)</label>
                      <VaultInput 
                        type="number"
                        step="0.01"
                        placeholder="∞"
                        defaultValue={field.max ? field.max / 100 : ""}
                        onChange={(e) => form.setValue(`irpfRanges.${index}.max`, e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Alíq (%)</label>
                      <VaultInput 
                        type="number"
                        step="0.1"
                        {...form.register(`irpfRanges.${index}.rate`, { valueAsNumber: true })}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Dedução (R$)</label>
                      <VaultInput 
                        type="number"
                        step="0.01"
                        defaultValue={field.deduction / 100}
                        onChange={(e) => form.setValue(`irpfRanges.${index}.deduction`, Math.round(parseFloat(e.target.value) * 100))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center pb-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <VaultFooter className="mt-6">
              <VaultSecondaryButton type="button" onClick={() => setOpen(false)}>
                {t("cancel")}
              </VaultSecondaryButton>
              <VaultPrimaryButton type="submit" disabled={saveStatus === "executing" || fetchStatus === "executing"}>
                {saveStatus === "executing" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("save")
                )}
              </VaultPrimaryButton>
            </VaultFooter>
          </VaultForm>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
