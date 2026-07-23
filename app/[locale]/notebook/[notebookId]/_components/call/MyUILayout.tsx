"use client";

import { useEffect, useState, useRef } from "react";
import {
  CallingState,
  StreamTheme,
  useCallStateHooks,
  ScreenShareButton,
} from "@stream-io/video-react-sdk";
import { useCall } from "@stream-io/video-react-bindings";
import { motion, AnimatePresence } from "framer-motion";
import { ParticipantsGrid } from "./ParticipantsGrid";
import { JoinUI } from "./JoinUI";
import { ControlButton } from "./ControlButton";
import {
  showJoinedCallToast,
  showLeftCallToast,
  showEndedCallToast,
} from "./CallToasts";
import { getGlassContainerClasses } from "./StreamUtils";
import { useCallStore } from "@/hooks/data/use-call-store";
import { endCallAction, leaveCallAction } from "@/modules/call/call.actions";
import { useIsMobile } from "@/hooks/ui/use-device";
import {
  Camera,
  CameraOff,
  LogOut,
  Mic,
  MicOff,
  Minimize2,
  Maximize2,
  PhoneOff,
  Loader2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MyUILayoutProps {
  /** Current user's Firebase UID */
  userId: string;
  /** Current user's display name */
  userName: string;
  /** Current user's role — determines which controls are shown */
  userRole: "teacher" | "student" | string;
  /** The student on this notebook — needed for call cleanup */
  studentId: string;
  /** Current notebook ID — attached to call metadata */
  notebookId: string;
}

export const MyUILayout = ({
  userId,
  userName,
  userRole,
  studentId,
  notebookId,
}: MyUILayoutProps) => {
  const call = useCall();
  const { callState, clearCall } = useCallStore();
  const isMobile = useIsMobile();

  const [isEnding, setIsEnding] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showPiPControls, setShowPiPControls] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isJoiningRef = useRef(false);

  const {
    useCallCallingState,
    useLocalParticipant,
    useRemoteParticipants,
    useMicrophoneState,
    useCameraState,
    useIsCallTranscribingInProgress,
    useIsCallRecordingInProgress,
  } = useCallStateHooks();

  const callingState = useCallCallingState();
  const { status: micStatus, isSpeakingWhileMuted } = useMicrophoneState();
  const { status: camStatus } = useCameraState();
  const isTranscribing = useIsCallTranscribingInProgress();
  const isRecording = useIsCallRecordingInProgress();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const isMicEnabled = micStatus === "disabled";
  const isCamEnabled = camStatus === "disabled";

  // --- Status Indicators (transcription / recording badges) ---
  const StatusIndicators = ({ isPip = false }) => (
    <div
      className={cn(
        "flex items-center gap-1.5",
        isPip ? "absolute top-2 left-2 z-20" : "absolute top-4 left-4 z-20",
      )}
    >
      <AnimatePresence>
        {isTranscribing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 bg-indigo-600/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/10"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>CC</span>
          </motion.div>
        )}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1 bg-red-600/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm border border-white/10"
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            <span>REC</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // FAILSAFE: force transcription if not active after joining
  useEffect(() => {
    if (
      callingState === CallingState.JOINED &&
      !isTranscribing &&
      call &&
      !isEnding
    ) {
      call.startTranscription().catch((err) => {
        console.log("[MyUILayout] Auto-start transcription attempt:", err);
      });
    }
  }, [callingState, isTranscribing, call, isEnding]);

  // Chrome background throttling: rejoin if tab becomes visible again
  useEffect(() => {
    if (
      call &&
      callState?.callId &&
      hasJoined &&
      callingState === CallingState.IDLE &&
      !isJoiningRef.current &&
      !isEnding
    ) {
      isJoiningRef.current = true;
      call
        .join()
        .catch(console.error)
        .finally(() => {
          isJoiningRef.current = false;
        });
    }

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        call &&
        callState?.callId &&
        hasJoined &&
        !isEnding &&
        callingState !== CallingState.JOINED &&
        callingState !== CallingState.JOINING &&
        callingState !== CallingState.RECONNECTING &&
        !isJoiningRef.current
      ) {
        isJoiningRef.current = true;
        call
          .join()
          .catch(console.error)
          .finally(() => {
            isJoiningRef.current = false;
          });
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [call, callState?.callId, callingState, hasJoined, isEnding]);

  // --- Handlers ---

  const handleJoinCall = async () => {
    if (
      callingState === CallingState.JOINED ||
      callingState === CallingState.JOINING ||
      isJoiningRef.current
    )
      return;

    if (!call) return;

    try {
      isJoiningRef.current = true;
      setHasJoined(true);
      await call.join({
        data: {
          settings_override: {
            limits: { max_duration_seconds: 3600 },
            transcription: { mode: "auto-on" },
          },
          custom: { studentId, notebookId },
        },
      });

      // Force transcription start right after joining
      try {
        await call.startTranscription();
      } catch {
        // Non-fatal — FAILSAFE useEffect above will retry
      }

      showJoinedCallToast();
    } catch (error) {
      console.error("[MyUILayout] Join error:", error);
      setHasJoined(false);
    } finally {
      isJoiningRef.current = false;
    }
  };

  /** Teacher ends the call for ALL participants */
  const handleEndCall = async () => {
    if (!call) return;
    try {
      setIsEnding(true);
      await call.endCall();
      await endCallAction({
        callId: callState?.callId ?? "",
        studentId,
        notebookId,
      });
      clearCall();
      setHasJoined(false);
      showEndedCallToast();
    } catch (error) {
      console.error("[MyUILayout] End call error:", error);
    } finally {
      setIsEnding(false);
    }
  };

  /** Student leaves the call without ending it for the teacher */
  const handleStudentLeaveCall = async () => {
    if (!call) return;
    try {
      setIsEnding(true);
      await call.leave();
      // Server Action clears callId from Firestore so the listener won't re-fire
      await leaveCallAction({ studentId: userId });
      clearCall();
      setHasJoined(false);
      showLeftCallToast();
    } catch (error) {
      console.error("[MyUILayout] Leave call error:", error);
    } finally {
      setIsEnding(false);
    }
  };

  const handleToggleAudio = async () => {
    try {
      await call?.microphone.toggle();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleVideo = async () => {
    try {
      await call?.camera.toggle();
    } catch (e) {
      console.error(e);
    }
  };

  const togglePiP = () => {
    setIsPiP((prev) => !prev);
    setShowMobileMenu(false);
  };

  // --- Sub-components ---

  const LeaveButton = () => {
    const isStudent = userRole === "student";
    return (
      <ControlButton
        onClick={isStudent ? handleStudentLeaveCall : handleEndCall}
        isEnabled={true}
        enabledIcon={isStudent ? LogOut : PhoneOff}
        disabledIcon={isStudent ? LogOut : PhoneOff}
        variant="destructive"
      />
    );
  };

  const TalkingWhileMutedToast = () => (
    <AnimatePresence>
      {isSpeakingWhileMuted && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur border border-white/10 pointer-events-none whitespace-nowrap"
        >
          <MicOff className="text-yellow-400 animate-pulse" size={18} />
          <span className="text-xs font-semibold">Você está falando no mudo</span>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // --- Render ---

  if (callingState === CallingState.IDLE && !hasJoined) {
    return (
      <JoinUI
        userRole={userRole}
        userName={userName}
        studentId={studentId}
        onJoin={handleJoinCall}
        joinLabel={userRole === "teacher" ? "Iniciar Aula" : "Entrar na Aula"}
        notebookId={notebookId}
      />
    );
  }

  const callComponent = (
    <StreamTheme>
      <motion.div
        drag={!isMobile ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100) {
            if (callingState === CallingState.JOINED) {
              togglePiP();
            } else {
              clearCall();
            }
          }
        }}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        className={getGlassContainerClasses(isMobile)}
      >
        {(callingState !== CallingState.JOINED || isEnding) && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm text-white rounded-3xl">
            <Loader2 className="animate-spin mb-2" size={32} />
            <span className="text-sm font-medium">
              {isEnding ? "Encerrando..." : "Conectando..."}
            </span>
          </div>
        )}

        <div className="flex flex-col h-full relative">
          <StatusIndicators />
          <TalkingWhileMutedToast />
          <div className="flex-1 overflow-hidden p-2 rounded-t-3xl">
            <ParticipantsGrid
              remoteParticipants={remoteParticipants}
              localParticipant={localParticipant}
            />
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 border-t border-slate-200 dark:border-slate-800 rounded-b-3xl">
            <div className="flex items-center justify-between gap-2 max-w-xs mx-auto">
              <ControlButton
                onClick={handleToggleAudio}
                isEnabled={!isMicEnabled}
                enabledIcon={Mic}
                disabledIcon={MicOff}
              />
              <ControlButton
                onClick={handleToggleVideo}
                isEnabled={!isCamEnabled}
                enabledIcon={Camera}
                disabledIcon={CameraOff}
              />
              {userRole === "teacher" && (
                <div className="md:flex hidden items-center justify-center">
                  <ScreenShareButton />
                </div>
              )}
              <ControlButton
                onClick={togglePiP}
                isEnabled={true}
                enabledIcon={Minimize2}
                disabledIcon={Minimize2}
                className="md:flex hidden"
              />

              <div className="md:hidden relative">
                <ControlButton
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  isEnabled={true}
                  enabledIcon={MoreVertical}
                  disabledIcon={MoreVertical}
                />
                <AnimatePresence>
                  {showMobileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-16 right-0 bg-white dark:bg-slate-900 p-2 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col gap-2 min-w-[140px] z-50"
                    >
                      <button
                        onClick={togglePiP}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full text-left"
                      >
                        <Minimize2 size={16} />
                        <span className="text-sm font-medium">Minimizar</span>
                      </button>
                      {userRole === "teacher" && (
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full relative overflow-hidden">
                          <ScreenShareButton />
                          <span className="text-sm font-medium">Compartilhar</span>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <LeaveButton />
            </div>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
  );

  return (
    <div
      ref={constraintsRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
    >
      <AnimatePresence>
        {!isPiP && callComponent}
        {isPiP && (
          <StreamTheme>
            <motion.div
              drag
              dragMomentum={false}
              dragConstraints={constraintsRef}
              onClick={() => setShowPiPControls(!showPiPControls)}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "pointer-events-auto fixed rounded-2xl overflow-hidden bg-black border border-white/10 flex flex-col",
                isMobile
                  ? "top-4 right-4 h-[13vh] aspect-video"
                  : "bottom-8 right-8 w-80 aspect-video",
              )}
            >
              <div className="flex-1 relative bg-slate-900 overflow-hidden">
                <StatusIndicators isPip />

                <AnimatePresence>
                  {isSpeakingWhileMuted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-black/60 p-2 rounded-full animate-pulse border border-yellow-500/50">
                      <MicOff className="text-yellow-500" size={24} />
                    </div>
                  )}
                </AnimatePresence>

                <ParticipantsGrid
                  variant="pip"
                  remoteParticipants={remoteParticipants}
                  localParticipant={localParticipant}
                />

                <AnimatePresence>
                  {showPiPControls && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 z-10 flex flex-col justify-between p-2 pointer-events-none"
                    >
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePiP();
                          }}
                          className="text-white hover:text-indigo-400 bg-black/50 rounded-full p-1.5 pointer-events-auto transition-colors"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
                      <div className="flex justify-center items-center gap-2 pointer-events-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleAudio();
                          }}
                          className={cn(
                            "p-2 rounded-full",
                            !isMicEnabled
                              ? "bg-slate-800 text-white"
                              : "bg-red-500 text-white",
                          )}
                        >
                          {!isMicEnabled ? (
                            <Mic size={14} />
                          ) : (
                            <MicOff size={14} />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVideo();
                          }}
                          className={cn(
                            "p-2 rounded-full",
                            !isCamEnabled
                              ? "bg-slate-800 text-white"
                              : "bg-red-500 text-white",
                          )}
                        >
                          {!isCamEnabled ? (
                            <Camera size={14} />
                          ) : (
                            <CameraOff size={14} />
                          )}
                        </button>
                        {userRole === "teacher" && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center scale-90"
                          >
                            <ScreenShareButton />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </StreamTheme>
        )}
      </AnimatePresence>
    </div>
  );
};
