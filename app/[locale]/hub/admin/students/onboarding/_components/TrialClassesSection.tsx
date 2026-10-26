"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { FileText, Loader2, RefreshCw, Sparkles, User, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { notify } from "@/components/ui/toaster";
import { Vault, VaultBody, VaultContent, VaultDescription, VaultHeader, VaultTitle } from "@/components/ui/vault";
import {
  buildTrialProfileAction,
  getTrialTranscriptAction,
  syncTrialTranscriptionAction,
} from "@/modules/trial-call/trial-call.actions";
import type { TrialNotes } from "@/modules/trial-call/trial-call.schema";

export interface TrialClassRow {
  id: string;
  code: string;
  status: "active" | "ended";
  createdAt: Date;
  guestName: string | null;
  guestEmail: string | null;
  transcriptionStatus: "pending" | "available" | "failed";
  hasNotes: boolean;
  profileId: string | null;
  profileStatus: "draft" | "active" | "archived" | null;
  studentId: string | null;
}

interface Detail {
  code: string;
  title: string;
  transcription: string | null;
  notes: TrialNotes;
}

/** Aulas experimentais: transcrição, anotações e o perfil rascunho gerado pela IA, para o admin revisar. */
export function TrialClassesSection({ rooms, basePath }: { rooms: TrialClassRow[]; basePath: string }) {
  const t = useTranslations("TrialClass.Admin");
  const locale = useLocale();
  const dateLocale = locale === "en" ? enUS : ptBR;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const run = (key: string, job: () => Promise<void>) => {
    setBusy(key);
    startTransition(async () => {
      try {
        await job();
      } finally {
        setBusy(null);
      }
    });
  };

  const openDetail = (room: TrialClassRow) =>
    run(`detail-${room.id}`, async () => {
      const res = await getTrialTranscriptAction({ code: room.code });
      if (!res?.data) {
        notify.error(t("loadError"));
        return;
      }
      setDetail({
        code: room.code,
        title: room.guestName ?? t("guestFallback"),
        transcription: res.data.transcription,
        notes: res.data.notes,
      });
    });

  const sync = (room: TrialClassRow) =>
    run(`sync-${room.id}`, async () => {
      const res = await syncTrialTranscriptionAction({ code: room.code });
      if (res?.data?.found) notify.success(t("synced"));
      else notify.error(t("notReady"));
    });

  const build = (room: TrialClassRow) =>
    run(`build-${room.id}`, async () => {
      const res = await buildTrialProfileAction({ code: room.code });
      if (res?.data?.profileId) notify.success(t("profileUpdated"));
      else notify.error(t("profileError"));
    });

  return (
    <section className="mb-8" aria-labelledby="trial-classes-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="trial-classes-title" className="text-lg font-bold">{t("title")}</h2>
        <Link href="/trial-class" className={cn(buttonVariants({ size: "sm" }), "gap-2 rounded-full font-bold")}>
          <Video className="size-4" aria-hidden />{t("start")}
        </Link>
      </div>

      {rooms.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-muted px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rooms.map((room) => {
            const transcriptReady = room.transcriptionStatus === "available";
            return (
              <li key={room.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"><User className="size-5" aria-hidden /></span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{room.guestName ?? t("noGuest")}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {room.guestEmail ?? t("noEmail")} · {format(new Date(room.createdAt), "dd MMM, HH:mm", { locale: dateLocale })}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="h-5 px-2 text-[10px] uppercase tracking-wider">{room.status === "active" ? t("live") : t("ended")}</Badge>
                      <Badge variant="outline" className={cn("h-5 px-2 text-[10px] uppercase tracking-wider", transcriptReady ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : room.transcriptionStatus === "failed" ? "border-red-500/30 bg-red-500/10 text-red-600" : "")}>
                        {t(`transcription.${room.transcriptionStatus}`)}
                      </Badge>
                      {room.profileStatus && (
                        <Badge variant="outline" className={cn("h-5 px-2 text-[10px] uppercase tracking-wider", room.profileStatus === "active" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-orange-500/30 bg-orange-500/10 text-orange-600")}>
                          {room.studentId ? t("linked") : room.profileStatus === "active" ? t("profileActive") : t("profileDraft")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={busy === `detail-${room.id}`} onClick={() => openDetail(room)}>
                    {busy === `detail-${room.id}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <FileText className="size-3.5" aria-hidden />}
                    {t("details")}
                  </Button>
                  {room.status === "ended" && !transcriptReady && (
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={busy === `sync-${room.id}`} onClick={() => sync(room)}>
                      {busy === `sync-${room.id}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <RefreshCw className="size-3.5" aria-hidden />}
                      {t("sync")}
                    </Button>
                  )}
                  {room.status === "ended" && (transcriptReady || room.hasNotes) && (
                    <Button variant="outline" size="sm" className="gap-1.5" disabled={busy === `build-${room.id}`} onClick={() => build(room)}>
                      {busy === `build-${room.id}` ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
                      {room.profileId ? t("rebuild") : t("build")}
                    </Button>
                  )}
                  {room.profileId && (
                    <Link href={`${basePath}/${room.profileId}`} className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
                      {t("review")}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Vault open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <VaultContent>
          <VaultHeader>
            <VaultTitle>{detail?.title}</VaultTitle>
            <VaultDescription>{t("detailsHint")}</VaultDescription>
          </VaultHeader>
          <VaultBody>
            {detail && (
              <div className="space-y-5 pb-2">
                <div className="space-y-2 text-sm">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("notes")}</h3>
                  <p><strong>{t("level")}:</strong> {detail.notes.level ?? "—"}</p>
                  <p><strong>{t("goals")}:</strong> {detail.notes.goals.join(", ") || "—"}</p>
                  <p><strong>{t("strengths")}:</strong> {detail.notes.strengths.join(", ") || "—"}</p>
                  <p><strong>{t("improve")}:</strong> {detail.notes.improve.join(", ") || "—"}</p>
                  {detail.notes.freeText && <p className="whitespace-pre-wrap text-muted-foreground">{detail.notes.freeText}</p>}
                </div>
                <div className="space-y-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("transcript")}</h3>
                  {detail.transcription ? (
                    <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs leading-relaxed">{detail.transcription}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t("noTranscript")}</p>
                  )}
                </div>
              </div>
            )}
          </VaultBody>
        </VaultContent>
      </Vault>
    </section>
  );
}
