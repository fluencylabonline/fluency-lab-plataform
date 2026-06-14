"use client";

import { useState } from "react";
import { Smartphone, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Vault,
  VaultTrigger,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import { PwaStats } from "@/modules/dashboard/dashboard.types";
import Image from "next/image";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PwaStatsVaultProps {
  data: PwaStats;
}

export function PwaStatsVault({ data }: PwaStatsVaultProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "installed" | "not_installed">("all");

  const installRate = data.total > 0 ? Math.round((data.installed / data.total) * 100) : 0;

  const filtered = data.students.filter((s) => {
    if (filter === "installed") return s.pwaInstalled;
    if (filter === "not_installed") return !s.pwaInstalled;
    return true;
  });

  return (
    <Vault open={open} onOpenChange={setOpen}>
      <VaultTrigger asChild>
        {/* Card */}
        <div
          id="pwa-stats-card"
          className="card relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-violet-400" />

          <div className="flex flex-row items-start justify-between space-y-0 pb-3 pt-5 px-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              PWA Instalado
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/60">
                <Smartphone className="h-3.5 w-3.5 text-violet-500" />
              </div>
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          <div className="px-5 pb-5">
            <div className="text-2xl font-bold tracking-tight tabular-nums">
              {data.installed}
              <span className="text-base font-normal text-muted-foreground/60 ml-1">
                / {data.total}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground/60">Taxa de adoção</span>
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {installRate}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{ width: `${installRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </VaultTrigger>

      <VaultContent aria-label="Adoção do PWA" className="sm:max-w-md">
        <VaultHeader>
          <VaultTitle>Adoção do PWA</VaultTitle>
          <VaultDescription>
            {data.installed} de {data.total} alunos ativos instalaram o app.
          </VaultDescription>
        </VaultHeader>

        <VaultBody>
          {/* Filter tabs */}
          <div className="flex gap-2 mb-1">
            {(["all", "installed", "not_installed"] as const).map((f) => (
              <button
                key={f}
                id={`pwa-filter-${f}`}
                onClick={() => setFilter(f)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150",
                  filter === f
                    ? "bg-violet-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {f === "all" && `Todos (${data.total})`}
                {f === "installed" && `Instalado (${data.installed})`}
                {f === "not_installed" && `Não instalado (${data.total - data.installed})`}
              </button>
            ))}
          </div>

          {/* Student list */}
          <div className="flex flex-col divide-y divide-border/50">
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">
                Nenhum aluno encontrado.
              </p>
            )}
            {filtered.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 py-3"
              >
                {/* Avatar */}
                <div className="relative shrink-0 w-9 h-9 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {student.photoUrl ? (
                    <Image
                      src={student.photoUrl}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {student.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  {student.pwaInstalled && student.pwaInstalledAt && (
                    <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                      Instalado em{" "}
                      {format(new Date(student.pwaInstalledAt), "dd 'de' MMM 'de' yyyy", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>

                {/* Badge */}
                <div className="shrink-0">
                  {student.pwaInstalled ? (
                    <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full px-2 py-0.5 text-xs font-medium border border-emerald-100 dark:border-emerald-900/60">
                      <CheckCircle2 className="w-3 h-3" />
                      Instalado
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium border border-border/50">
                      <XCircle className="w-3 h-3" />
                      Não instalado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
