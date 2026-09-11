"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, differenceInCalendarDays, isSameMonth, parseISO } from "date-fns";
import { Clock, Video, FileText, RefreshCw, Play, Loader2, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notify } from "@/components/ui/toaster";
import { syncCallTranscriptionAction, getCallRecordingsAction } from "@/modules/call/call.actions";
import type { CallSession, CallRecordingSummary } from "@/modules/call/call.schema";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import { SectionLabel } from "./UserDetailsPrimitives";

/** Stream keeps call recordings for this many days before deleting them. */
const RECORDING_RETENTION_DAYS = 14;

interface CallSessionsSectionProps {
  callHistory: CallSession[];
  /** Only sessions inside this month are listed, following the curriculum view. */
  monthDate: Date;
  /** Recordings are admin-only; managers still get transcripts. */
  canViewRecordings: boolean;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value as string);
}

export function CallSessionsSection({
  callHistory,
  monthDate,
  canViewRecordings,
}: CallSessionsSectionProps) {
  const t = useTranslations("UserManagement");
  const router = useRouter();

  const [syncingCallId, setSyncingCallId] = useState<string | null>(null);
  const [loadingRecordingId, setLoadingRecordingId] = useState<string | null>(null);
  const [openRecording, setOpenRecording] = useState<{
    session: CallSession;
    recordings: CallRecordingSummary[];
  } | null>(null);
  const [openTranscript, setOpenTranscript] = useState<CallSession | null>(null);

  const sessions = callHistory
    .filter((call) => isSameMonth(toDate(call.startedAt), monthDate))
    .sort((a, b) => toDate(b.startedAt).getTime() - toDate(a.startedAt).getTime());

  const handleSync = async (streamCallId: string) => {
    setSyncingCallId(streamCallId);
    try {
      const result = await syncCallTranscriptionAction({ streamCallId });
      if (result?.data?.success) {
        notify.success(t("transcriptSynced"));
        router.refresh();
      } else {
        notify.error(t("transcriptNotReady"));
      }
    } catch {
      notify.error(t("transcriptSyncError"));
    } finally {
      setSyncingCallId(null);
    }
  };

  const handleOpenRecording = async (session: CallSession) => {
    setLoadingRecordingId(session.streamCallId);
    try {
      const result = await getCallRecordingsAction({ streamCallId: session.streamCallId });
      const recordings = result?.data?.recordings ?? [];

      if (!result?.data?.success || recordings.length === 0) {
        notify.error(t("recordingUnavailable"));
        return;
      }

      setOpenRecording({ session, recordings });
    } catch {
      notify.error(t("recordingUnavailable"));
    } finally {
      setLoadingRecordingId(null);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--:--";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <SectionLabel>{t("classSessions")}</SectionLabel>
        {canViewRecordings && sessions.length > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t("recordingRetentionNote", { days: RECORDING_RETENTION_DAYS })}
          </span>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="border border-dashed border-border rounded-md py-10 flex flex-col items-center gap-2">
          <Video className="w-7 h-7 text-muted-foreground opacity-30" strokeWidth={1} />
          <p className="text-xs text-muted-foreground">{t("noSessionsThisMonth")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sessions.map((call) => {
            const startedAt = toDate(call.startedAt);
            const daysOld = differenceInCalendarDays(new Date(), startedAt);
            const daysLeft = RECORDING_RETENTION_DAYS - daysOld;
            const recordingExpired = daysLeft <= 0;
            const hasTranscript = call.transcriptionStatus === "available";

            return (
              <div key={call.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Video className="w-4 h-4 text-primary shrink-0" />
                    <span>{format(startedAt, "dd/MM · HH:mm")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(call.durationSeconds)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-3 border-t border-border/50">
                  <span className="text-muted-foreground">{t("transcript")}</span>
                  <Badge
                    variant="outline"
                    className={
                      hasTranscript
                        ? "text-[9px] h-4 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : call.transcriptionStatus === "failed"
                          ? "text-[9px] h-4 font-black uppercase tracking-widest bg-destructive/10 text-destructive border-destructive/20"
                          : "text-[9px] h-4 font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }
                  >
                    {hasTranscript
                      ? t("transcriptAvailable")
                      : call.transcriptionStatus === "failed"
                        ? t("transcriptFailed")
                        : t("transcriptProcessing")}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2">
                  {hasTranscript ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => setOpenTranscript(call)}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      {t("viewTranscript")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                      onClick={() => handleSync(call.streamCallId)}
                      disabled={syncingCallId === call.streamCallId}
                    >
                      <RefreshCw
                        className={`w-3 h-3 mr-2 ${syncingCallId === call.streamCallId ? "animate-spin" : ""}`}
                      />
                      {syncingCallId === call.streamCallId ? t("syncingTranscript") : t("syncTranscript")}
                    </Button>
                  )}

                  {canViewRecordings &&
                    (recordingExpired ? (
                      <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold py-1">
                        {t("recordingExpired")}
                      </p>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
                          onClick={() => handleOpenRecording(call)}
                          disabled={loadingRecordingId === call.streamCallId}
                        >
                          {loadingRecordingId === call.streamCallId ? (
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 mr-2" />
                          )}
                          {loadingRecordingId === call.streamCallId
                            ? t("loadingRecording")
                            : t("watchRecording")}
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground">
                          {t("recordingExpiresIn", { days: daysLeft })}
                        </p>
                      </>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transcript viewer */}
      <Vault open={!!openTranscript} onOpenChange={(open) => !open && setOpenTranscript(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("classTranscript")}</VaultTitle>
            <VaultDescription>
              {openTranscript && format(toDate(openTranscript.startedAt), "dd/MM/yyyy HH:mm")}
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="p-4 bg-muted/30 rounded-lg max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {openTranscript?.transcription || t("noSpeechDetected")}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* Recording player */}
      <Vault open={!!openRecording} onOpenChange={(open) => !open && setOpenRecording(null)}>
        <VaultContent className="max-w-3xl">
          <VaultHeader>
            <VaultTitle>{t("classRecording")}</VaultTitle>
            <VaultDescription>
              {openRecording && format(toDate(openRecording.session.startedAt), "dd/MM/yyyy HH:mm")}
            </VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="flex flex-col gap-3">
              {openRecording?.recordings.map((recording) => (
                <div key={recording.filename} className="flex flex-col gap-2">
                  <video
                    src={recording.url}
                    controls
                    preload="metadata"
                    className="w-full rounded-lg bg-black aspect-video"
                  />
                  <a
                    href={recording.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="self-end"
                  >
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Download className="w-3 h-3 mr-2" />
                      {t("downloadRecording")}
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>
    </div>
  );
}
