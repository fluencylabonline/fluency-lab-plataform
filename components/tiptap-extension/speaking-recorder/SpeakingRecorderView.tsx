"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { 
  Mic, 
  Square, 
  Trash2, 
  Play, 
  Pause, 
  RefreshCw, 
  Upload, 
  Loader2, 
  Volume2, 
  VolumeX,
  FileAudio
} from "lucide-react";
import { notify } from "@/components/ui/toaster";
import { storage } from "@/lib/firebase-storage";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { registerNotebookAssetAction } from "@/modules/notebook/notebook.actions";
import { useTranslations } from "next-intl";

export function SpeakingRecorderView({ node, updateAttributes }: NodeViewProps) {
  const t = useTranslations("SpeakingRecorder");
  const { nodeId, audioUrl } = node.attrs;

  // Globals from Editor context
  const userId = ((globalThis as Record<string, unknown>).__userId as string) ?? "anonymous";
  const notebookId = (globalThis as Record<string, unknown>).__notebookId as string;

  // MediaRecorder Refs and States
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Player States
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  // Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Handle Play/Pause on the active audio element
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error("Audio playback error:", err);
        notify.error(t("playError"));
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "00:00";
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = Math.floor(secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Recording Actions
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        notify.error(t("unsupported"));
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Determine best mimeType supported
      let options = { mimeType: "audio/webm" };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/ogg" };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: "audio/mp4" };
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const localAudioUrl = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setLocalUrl(localAudioUrl);
        // Stop stream tracks to turn off the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setSeconds(0);
      setAudioBlob(null);
      setLocalUrl(null);
    } catch (err) {
      console.error("Microphone access error:", err);
      notify.error(t("micDenied"));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setLocalUrl(null);
    setSeconds(0);
  };

  const handleUploadAudio = async () => {
    if (!audioBlob || !notebookId) {
      notify.error(t("nothingToSave"));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const ext = audioBlob.type.split("/")[1]?.split(";")[0] || "webm";
    const filename = `speaking-${nodeId}-${Date.now()}.${ext}`;
    const storagePath = `notebooks/${notebookId}/${userId}/${filename}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, audioBlob);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error("Storage upload error:", error);
        notify.error(t("uploadError"));
        setIsUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Register asset in Neon database
          const dbResult = await registerNotebookAssetAction({
            notebookId,
            filePath: storagePath,
            fileName: filename,
            contentType: audioBlob.type,
            sizeBytes: audioBlob.size,
          });

          if (dbResult?.data?.success) {
            updateAttributes({
              audioUrl: downloadUrl,
              filePath: storagePath,
            });
            notify.success(t("sent"));
          } else {
            notify.error(t("registerError"));
          }
        } catch (err) {
          console.error("Error finalizing audio upload:", err);
          notify.error(t("syncError"));
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          resetRecording();
        }
      }
    );
  };

  // Deletion logic (resets local state and attributes)
  const handleDeleteAudio = () => {
    updateAttributes({
      audioUrl: "",
      filePath: "",
    });
    resetRecording();
    notify.success(t("removed"));
  };

  // Determine permissions: students and teachers can manage their recordings
  const canModify = true; // Anyone with editor access can clear and re-record

  return (
    <NodeViewWrapper className="my-4">
      {/* Tiptap Block Container without Shadows */}
      <div className="card border border-muted bg-card/60 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300">
        
        {/* Header containing name and title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-xl text-white shrink-0">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                {t("title")}
              </h4>
              <p className="text-xs text-muted-foreground font-normal">
                {t("subtitle")}
              </p>
            </div>
          </div>

          {/* Delete Audio Button if already uploaded */}
          {audioUrl && canModify && (
            <button
              onClick={handleDeleteAudio}
              className="p-2 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-lg transition-colors cursor-pointer"
              title={t("delete")}
              aria-label={t("delete")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ────────── CASE 1: Active audio exists (uploaded) ────────── */}
        {audioUrl ? (
          <div className="flex flex-col gap-3">
            {/* Custom Premium Audio Player */}
            <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-muted/50">
              <button
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-full hover:scale-105 transition-all cursor-pointer shrink-0"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>

              <div className="flex flex-col flex-1 gap-1.5 min-w-0">
                <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1">
                    <FileAudio className="w-3.5 h-3.5 text-indigo-500" />
                    {t("recordedAudio")}
                  </span>
                  <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                
                {/* Progress bar */}
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-muted text-muted-foreground rounded-lg transition-colors cursor-pointer shrink-0"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Native audio element hidden */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          </div>
        ) : (
          /* ────────── CASE 2: No active audio ────────── */
          <div className="flex flex-col items-center justify-center p-6 border border-dashed border-muted rounded-xl bg-muted/10 gap-4">
            
            {/* Timer and Wave Anims when Recording */}
            {isRecording ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-bold text-red-500 font-mono tracking-wider animate-pulse flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  {formatTime(seconds)}
                </span>
                <p className="text-xs text-muted-foreground">{t("recording")}</p>
                
                {/* Simulated Audio Wave Visualizer */}
                <div className="flex items-center gap-1 h-6 mt-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-indigo-500 to-pink-500 rounded-full animate-bounce"
                      style={{
                        height: `${Math.floor(Math.random() * 100) + 20}%`,
                        animationDuration: `${Math.floor(Math.random() * 500) + 400}ms`,
                        animationDelay: `${i * 100}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : localUrl ? (
              /* Local preview before upload */
              <div className="w-full flex flex-col gap-3">
                <p className="text-xs font-semibold text-center text-amber-600 dark:text-amber-400">
                  {t("localPreview")}
                </p>

                {/* Mini Local Player */}
                <div className="flex items-center gap-3 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                  <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-full hover:scale-105 transition-all cursor-pointer shrink-0"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                  </button>

                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between text-xs text-muted-foreground">
                      <span>{t("temporary")}</span>
                      <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <audio
                    ref={audioRef}
                    src={localUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                </div>

                {/* Local Actions */}
                <div className="flex items-center justify-center gap-3 mt-1.5">
                  <button
                    onClick={resetRecording}
                    disabled={isUploading}
                    className="btn flex items-center gap-1.5 px-3 py-1.5 border border-muted hover:bg-muted text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {t("recordAgain")}
                  </button>
                  <button
                    onClick={handleUploadAudio}
                    disabled={isUploading}
                    className="btn flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-pink-500 text-white hover:opacity-90 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t("uploading", { progress: uploadProgress })}
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        {t("saveToNotebook")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Ready to record state */
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={startRecording}
                  className="w-14 h-14 flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 hover:rotate-6 text-white rounded-full transition-all duration-200 cursor-pointer"
                  title={t("start")}
                  aria-label={t("start")}
                >
                  <Mic className="w-6 h-6" />
                </button>
                <div className="text-center">
                  <p className="text-xs font-bold text-foreground">{t("clickToRecord")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t("readAloud")}</p>
                </div>
              </div>
            )}

            {/* Recording Stop Trigger */}
            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                {t("stop")}
              </button>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
