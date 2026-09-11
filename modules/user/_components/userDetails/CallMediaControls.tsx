"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, differenceInCalendarDays, parseISO } from "date-fns";
import { FileText, RefreshCw, Play, Loader2, Download } from "lucide-react";

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

/** Stream keeps call recordings for this many days before deleting them. */
const RECORDING_RETENTION_DAYS = 14;

interface CallMediaControlsProps {
  callSession: CallSession;
  /** Recordings are admin-only; managers still get transcripts. */
  canViewRecordings: boolean;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : parseISO(value as string);
}

/**
 * Transcript + recording controls for a single call session — meant to be
 * embedded inside a class card. Self-contained: manages its own sync/fetch
 * state and viewer dialogs so multiple cards on the same page don't collide.
 */
export function CallMediaControls({ callSession, canViewRecordings }: CallMediaControlsProps) {
  const t = useTranslations("UserManagement");
  const router = useRouter();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingRecording, setIsLoadingRecording] = useState(false);
  const [recordings, setRecordings] = useState<CallRecordingSummary[] | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  const hasTranscript = callSession.transcriptionStatus === "available";
  const startedAt = toDate(callSession.startedAt);
  const daysOld = differenceInCalendarDays(new Date(), startedAt);
  const daysLeft = RECORDING_RETENTION_DAYS - daysOld;
  const recordingExpired = daysLeft <= 0;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncCallTranscriptionAction({ streamCallId: callSession.streamCallId });
      if (result?.data?.success) {
        notify.success(t("transcriptSynced"));
        router.refresh();
      } else {
        notify.error(t("transcriptNotReady"));
      }
    } catch {
      notify.error(t("transcriptSyncError"));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleOpenRecording = async () => {
    setIsLoadingRecording(true);
    try {
      const result = await getCallRecordingsAction({ streamCallId: callSession.streamCallId });
      const list = result?.data?.recordings ?? [];

      if (!result?.data?.success || list.length === 0) {
        notify.error(t("recordingUnavailable"));
        return;
      }

      setRecordings(list);
    } catch {
      notify.error(t("recordingUnavailable"));
    } finally {
      setIsLoadingRecording(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-border/50">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{t("transcript")}</span>
        <Badge
          variant="outline"
          className={
            hasTranscript
              ? "text-[9px] h-4 font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : callSession.transcriptionStatus === "failed"
                ? "text-[9px] h-4 font-black uppercase tracking-widest bg-destructive/10 text-destructive border-destructive/20"
                : "text-[9px] h-4 font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border-amber-500/20"
          }
        >
          {hasTranscript
            ? t("transcriptAvailable")
            : callSession.transcriptionStatus === "failed"
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
            onClick={() => setShowTranscript(true)}
          >
            <FileText className="w-3 h-3 mr-2" />
            {t("viewTranscript")}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-3 h-3 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? t("syncingTranscript") : t("syncTranscript")}
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
                onClick={handleOpenRecording}
                disabled={isLoadingRecording}
              >
                {isLoadingRecording ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Play className="w-3 h-3 mr-2" />
                )}
                {isLoadingRecording ? t("loadingRecording") : t("watchRecording")}
              </Button>
              <p className="text-[10px] text-center text-muted-foreground">
                {t("recordingExpiresIn", { days: daysLeft })}
              </p>
            </>
          ))}
      </div>

      {/* Transcript viewer */}
      <Vault open={showTranscript} onOpenChange={setShowTranscript}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{t("classTranscript")}</VaultTitle>
            <VaultDescription>{format(startedAt, "dd/MM/yyyy HH:mm")}</VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="p-4 bg-muted/30 rounded-lg max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
              {callSession.transcription || t("noSpeechDetected")}
            </div>
          </VaultBody>
        </VaultContent>
      </Vault>

      {/* Recording player */}
      <Vault open={!!recordings} onOpenChange={(open) => !open && setRecordings(null)}>
        <VaultContent className="max-w-3xl">
          <VaultHeader>
            <VaultTitle>{t("classRecording")}</VaultTitle>
            <VaultDescription>{format(startedAt, "dd/MM/yyyy HH:mm")}</VaultDescription>
          </VaultHeader>
          <VaultBody>
            <div className="flex flex-col gap-3">
              {recordings?.map((recording) => (
                <div key={recording.filename} className="flex flex-col gap-2">
                  <video
                    src={recording.url}
                    controls
                    preload="metadata"
                    className="w-full rounded-lg bg-black aspect-video"
                  />
                  <a href={recording.url} target="_blank" rel="noopener noreferrer" className="self-end">
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
