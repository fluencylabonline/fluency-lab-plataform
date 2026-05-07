"use client";

import type { PlayedEntry } from "@/modules/immersion/immersion.types";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultBody,
} from "@/components/ui/vault";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type WordleHistoryModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: PlayedEntry[];
};

export function WordleHistoryModal({
  open,
  onOpenChange,
  entries,
}: WordleHistoryModalProps) {
  const groups: { dayLabel: string; entries: PlayedEntry[] }[] = [];
  const map = new Map<string, PlayedEntry[]>();

  entries.forEach((e) => {
    const lbl = new Date(e.ts).toLocaleDateString();
    const arr = map.get(lbl) || [];
    arr.push(e);
    map.set(lbl, arr);
  });

  Array.from(map.entries())
    .sort((a, b) => {
      const at = Math.max(...a[1].map((x) => x.ts));
      const bt = Math.max(...b[1].map((x) => x.ts));
      return bt - at;
    })
    .forEach(([dayLabel, dayEntries]) =>
      groups.push({ dayLabel, entries: dayEntries }),
    );

  const defaultOpenDay = groups.length > 0 ? [groups[0].dayLabel] : [];

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-md">
        <VaultHeader>
          <VaultTitle className="text-xl tracking-wide">
            Histórico de Jogadas
          </VaultTitle>
        </VaultHeader>

        <VaultBody className="overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <span className="text-3xl">📭</span>
              <p className="text-muted-foreground text-base">
                Nenhuma jogada recente encontrada.
              </p>
            </div>
          ) : (
            <Accordion
              multiple
              defaultValue={defaultOpenDay}
              className="w-full space-y-4 pb-4"
            >
              {groups.map((g) => {
                const wins = g.entries.filter((e) => e.success).length;
                const total = g.entries.length;
                const winRate = Math.round((wins / total) * 100) || 0;

                return (
                  <AccordionItem
                    key={g.dayLabel}
                    value={g.dayLabel}
                    className="border border-border/60 rounded-lg bg-muted/10 px-4"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <div className="font-semibold text-foreground text-lg">
                          {g.dayLabel}
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 font-medium">
                            <span className="text-emerald-500">{wins}</span>
                            <span className="text-muted-foreground/50">/</span>
                            <span className="text-muted-foreground">
                              {total}
                            </span>
                          </div>
                          <div className="bg-muted px-2 py-0.5 rounded-full text-xs font-semibold text-foreground/80">
                            {winRate}%
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <div className="space-y-2 pt-2 pb-2">
                        {g.entries.map((h) => (
                          <div
                            key={`${h.word}-${h.ts}`}
                            className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-4 py-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground tracking-wide">
                                  {h.word.toUpperCase()}
                                </span>
                                {h.lang && (
                                  <span className="text-[10px] font-bold text-muted-foreground bg-border/50 px-1.5 py-0.5 rounded uppercase">
                                    {h.lang}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-medium">
                                {new Date(h.ts).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>

                            <div className="flex items-center gap-4">
                              {typeof h.attempts === "number" && (
                                <span className="text-xs font-medium text-muted-foreground bg-muted border border-border px-2 py-1 rounded-md">
                                  {h.attempts}/6
                                </span>
                              )}
                              <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                  h.success
                                    ? "bg-emerald-500/10 text-emerald-500"
                                    : "bg-red-500/10 text-red-500"
                                }`}
                              >
                                {h.success ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                ) : (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
