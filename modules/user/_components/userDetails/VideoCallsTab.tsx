"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, startOfWeek, endOfWeek, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CallSession } from "../../../call/call.schema";
import { Clock, Video, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { syncCallTranscriptionAction } from "@/modules/call/call.actions";
import {
  Vault,
  VaultTrigger,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";

interface VideoCallsTabProps {
  callHistory: CallSession[];
}

export function VideoCallsTab({ callHistory }: VideoCallsTabProps) {
  const [syncingCallId, setSyncingCallId] = useState<string | null>(null);
  const router = useRouter();

  const handleSync = async (streamCallId: string) => {
    setSyncingCallId(streamCallId);
    try {
      const result = await syncCallTranscriptionAction({ streamCallId });
      if (result?.data?.success) {
        notify.success("Transcrição sincronizada com sucesso!");
        router.refresh();
      } else {
        notify.error(result?.data?.error || "Transcrição ainda não disponível no GetStream.");
      }
    } catch {
      notify.error("Erro ao sincronizar transcrição.");
    } finally {
      setSyncingCallId(null);
    }
  };

  // Group by Month and then by Week
  const groupedCalls = callHistory.reduce((acc, call) => {
    const date = call.startedAt instanceof Date ? call.startedAt : parseISO(call.startedAt as unknown as string);
    const monthKey = format(date, "MMMM yyyy", { locale: ptBR });

    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
    const weekKey = `Semana ${format(weekStart, "dd/MM")} - ${format(weekEnd, "dd/MM")}`;

    if (!acc[monthKey]) acc[monthKey] = {};
    if (!acc[monthKey][weekKey]) acc[monthKey][weekKey] = [];

    acc[monthKey][weekKey].push(call);
    return acc;
  }, {} as Record<string, Record<string, CallSession[]>>);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} min`;
  };

  return (
    <div className="space-y-8">
      {Object.keys(groupedCalls).length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 rounded-md border border-dashed">
          <Video className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
          <p className="text-muted-foreground">Nenhuma chamada de vídeo registrada.</p>
        </div>
      ) : (
        Object.entries(groupedCalls).map(([month, weeks]) => (
          <div key={month} className="space-y-4">
            <h3 className="text-lg font-bold capitalize">{month}</h3>

            {Object.entries(weeks).map(([week, calls]) => (
              <div key={week} className="space-y-3 pl-4 border-l-2 border-primary/20">
                <h4 className="text-sm font-medium text-muted-foreground">{week}</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {calls.map((call) => (
                    <div key={call.id} className="item p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Video className="w-4 h-4 text-primary  mr-2" />
                          <span>{format(new Date(call.startedAt), "dd/MM - HH:mm")}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-2" />
                          <span>{formatDuration(call.durationSeconds)}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Transcrição:</span>
                          <span className={
                            call.transcriptionStatus === "available"
                              ? "text-green-500 font-medium"
                              : call.transcriptionStatus === "failed"
                              ? "text-red-500 font-medium"
                              : "text-amber-500"
                          }>
                            {call.transcriptionStatus === "available"
                              ? "Disponível"
                              : call.transcriptionStatus === "failed"
                              ? "Falhou"
                              : "Processando..."}
                          </span>
                        </div>

                        {call.transcriptionStatus === "available" ? (
                          <Vault>
                            <VaultTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-8 text-xs gap-2"
                              >
                                <FileText className="w-3 h-3  mr-2" />
                                Ver Transcrição
                              </Button>
                            </VaultTrigger>
                            <VaultContent>
                              <VaultHeader>
                                <VaultTitle>Transcrição da Aula</VaultTitle>
                                <VaultDescription>
                                  Aula de{" "}
                                  {format(
                                    new Date(call.startedAt),
                                    "dd/MM/yyyy HH:mm"
                                  )}
                                </VaultDescription>
                              </VaultHeader>

                              <VaultBody>
                                <div className="p-4 bg-muted/30 rounded-lg max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
                                  {call.transcription || "Nenhuma fala detectada na aula."}
                                </div>
                              </VaultBody>
                            </VaultContent>
                          </Vault>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs gap-2"
                            onClick={() => handleSync(call.streamCallId)}
                            disabled={syncingCallId === call.streamCallId}
                          >
                            {syncingCallId === call.streamCallId ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                                Sincronizando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Sincronizar
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
