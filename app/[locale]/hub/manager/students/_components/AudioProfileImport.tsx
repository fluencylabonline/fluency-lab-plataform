"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ref, uploadBytesResumable } from "firebase/storage";
import { FileAudio, Sparkles, Upload, X } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { notify } from "@/components/ui/toaster";
import { auth } from "@/lib/firebase-auth";
import { storage } from "@/lib/firebase-storage";
import { fillProfileFromAudioAction } from "@/modules/learning/learning.actions";

/** Same cache name used by the share-target handler in sw.ts. */
const SHARED_AUDIO_CACHE = "shared-audio";

const MIME_BY_EXTENSION: Record<string, string> = {
  opus: "audio/ogg",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  aac: "audio/aac",
  wav: "audio/wav",
  mp4: "video/mp4",
};

const STEP_TITLES: Record<string, string> = {
  step1: "Informações Básicas",
  step2: "Histórico de Estudo",
  step3: "Objetivos Principais",
  step4: "Tempo Disponível",
  step5: "Carreira",
  step6: "Interesses",
  step7: "Estilo de Aprendizado",
  step8: "Bloqueios",
  step9: "Personalização",
  step10: "Finalização",
};

interface AudioProfileImportProps {
  userId: string;
  basePath: string;
  profileId?: string;
  studentId?: string;
  /** True when the page was opened by the OS share sheet. */
  openedByShare?: boolean;
}

type Phase = "idle" | "uploading" | "analyzing" | "done";

function resolveMimeType(file: File): string {
  if (file.type && file.type !== "application/octet-stream") return file.type.split(";")[0];
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "audio/ogg";
}

async function takeSharedFiles(): Promise<File[]> {
  if (typeof caches === "undefined") return [];
  const cache = await caches.open(SHARED_AUDIO_CACHE);
  const files: File[] = [];
  for (const request of await cache.keys()) {
    const response = await cache.match(request);
    if (!response) continue;
    const name = decodeURIComponent(response.headers.get("X-File-Name") || "audio");
    files.push(new File([await response.blob()], name, { type: response.headers.get("Content-Type") || "" }));
    await cache.delete(request);
  }
  return files;
}

export function AudioProfileImport({
  userId,
  basePath,
  profileId,
  studentId,
  openedByShare = false,
}: AudioProfileImportProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [resultProfileId, setResultProfileId] = useState<string | undefined>(profileId);
  const [filled, setFilled] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!openedByShare) return;
    takeSharedFiles()
      .then((shared) => {
        if (shared.length > 0) setFiles(shared);
        else notify.error("Não recebemos o áudio compartilhado. Selecione o arquivo manualmente.");
      })
      .catch(() => notify.error("Não foi possível ler o áudio compartilhado."));
  }, [openedByShare]);

  const uploadFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "audio";
      const storagePath = `profile-audio/${userId}/${crypto.randomUUID()}.${extension}`;
      const task = uploadBytesResumable(ref(storage, storagePath), file, { contentType: resolveMimeType(file) });
      task.on(
        "state_changed",
        (snapshot) => setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
        reject,
        () => resolve(storagePath),
      );
    });

  const describeUploadError = (error: unknown): string => {
    const code = (error as { code?: string } | null)?.code ?? "";
    if (code === "storage/unauthorized") {
      return "Sem permissão para enviar o áudio. Peça para publicar as regras do Storage ou entre novamente.";
    }
    if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") {
      return "Conexão instável durante o envio. Tente novamente.";
    }
    return `Falha no envio do áudio${code ? ` (${code})` : ""}. Tente novamente.`;
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    let currentProfileId = resultProfileId;
    const allFilled = new Set<string>();
    const allEvidence: Record<string, string> = {};

    // The Storage rules check the role claim, so make sure the session is ready and the token fresh.
    await auth.authStateReady();
    if (!auth.currentUser) {
      notify.error("Sessão expirada. Entre novamente para enviar o áudio.");
      return;
    }
    await auth.currentUser.getIdToken(true).catch(() => undefined);

    for (const file of files) {
      setProgress(0);
      setPhase("uploading");

      let storagePath: string;
      try {
        storagePath = await uploadFile(file);
      } catch (error) {
        console.error("[AudioProfileImport] upload failed", error);
        notify.error(describeUploadError(error));
        setPhase("idle");
        return;
      }

      setPhase("analyzing");
      try {
        const result = await fillProfileFromAudioAction({
          storagePath,
          mimeType: resolveMimeType(file),
          profileId: currentProfileId,
          studentId,
        });
        if (!result?.data?.success) {
          notify.error(result?.serverError || "Não foi possível analisar o áudio.");
          setPhase("idle");
          return;
        }
        currentProfileId = result.data.profileId;
        result.data.filled.forEach((path) => allFilled.add(path));
        Object.assign(allEvidence, result.data.evidence);
      } catch (error) {
        console.error("[AudioProfileImport] analysis failed", error);
        notify.error("A análise demorou demais ou falhou. Tente novamente.");
        setPhase("idle");
        return;
      }
    }

    setResultProfileId(currentProfileId);
    setFilled([...allFilled]);
    setEvidence(allEvidence);
    setPhase("done");
  };

  const filledByStep = filled.reduce<Record<string, string[]>>((acc, path) => {
    const [step] = path.split(".");
    (acc[step] ??= []).push(path);
    return acc;
  }, {});

  const isBusy = phase === "uploading" || phase === "analyzing";

  return (
    <div>
      <Header
        title="Perfil por Áudio"
        subtitle="Envie a conversa inicial e a IA preenche o que conseguir."
        showSubHeader={false}
        backHref={basePath}
      />

      <main className="container max-w-2xl py-8 pb-32 space-y-6" data-tour="onboarding-audio.upload">
        {phase !== "done" && (
          <>
            <div className="card p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Aceita áudios do WhatsApp (.opus, .ogg), mp3, m4a e vídeos mp4. A IA preenche apenas os campos
                que ainda estão vazios; o que não for dito fica em branco para você completar. O áudio é apagado
                logo após a análise.
              </p>

              <input
                ref={inputRef}
                type="file"
                multiple
                hidden
                accept="audio/*,video/mp4,.opus,.ogg,.oga,.m4a,.mp3,.aac,.wav,.mp4"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />

              {files.length === 0 ? (
                <Button variant="outline" className="w-full h-24" onClick={() => inputRef.current?.click()} disabled={isBusy}>
                  <Upload className="h-5 w-5 mr-2" />
                  Selecionar áudio
                </Button>
              ) : (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-md border p-3">
                      <FileAudio className="h-5 w-5 text-primary shrink-0" />
                      <span className="flex-1 truncate text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      {!isBusy && (
                        <button
                          type="button"
                          aria-label="Remover áudio"
                          onClick={() => setFiles(files.filter((_, i) => i !== index))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {phase === "uploading" && (
                <div className="space-y-1">
                  <div className="h-1.5 rounded-full bg-border/40 overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">Enviando áudio… {progress}%</p>
                </div>
              )}
              {phase === "analyzing" && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> Ouvindo e preenchendo o perfil. Isso pode levar alguns minutos…
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {files.length > 0 && !isBusy && (
                <Button variant="outline" onClick={() => inputRef.current?.click()}>
                  Trocar
                </Button>
              )}
              <Button className="flex-1" onClick={handleAnalyze} disabled={files.length === 0 || isBusy}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analisar e preencher
              </Button>
            </div>
          </>
        )}

        {phase === "done" && (
          <>
            <div className="card p-6 space-y-1">
              <h2 className="text-lg font-semibold">
                {filled.length > 0 ? `${filled.length} campos preenchidos` : "Nada para preencher"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filled.length > 0
                  ? "Confira abaixo o que a IA ouviu. Os demais campos continuam em branco para você completar."
                  : "A IA não encontrou respostas claras no áudio. O perfil foi criado em branco para você preencher."}
              </p>
            </div>

            {Object.entries(filledByStep).map(([step, paths]) => (
              <div key={step} className="card p-4 space-y-2">
                <h3 className="font-semibold text-sm">{STEP_TITLES[step] ?? step}</h3>
                <ul className="space-y-1.5">
                  {paths.map((path) => (
                    <li key={path} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{path.split(".")[1]}</span>
                      {evidence[path] ? ` — “${evidence[path]}”` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <Button className="w-full" onClick={() => router.push(`${basePath}/${resultProfileId}`)}>
              Revisar e completar perfil
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
