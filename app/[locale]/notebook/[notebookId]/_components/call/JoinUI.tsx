"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  StreamTheme,
  useCallStateHooks,
  Avatar,
} from "@stream-io/video-react-sdk";
import { useCall } from "@stream-io/video-react-bindings";
import { Button } from "@/components/ui/button";
import { useCallStore } from "@/hooks/data/use-call-store";
import { useIsMobile } from "@/hooks/ui/use-device";
import { endCallAction, leaveCallAction } from "@/modules/call/call.actions";
import { showCanceledCallToast } from "./CallToasts";
import { getGlassContainerClasses } from "./StreamUtils";

interface JoinUIProps {
  /** Current user's role */
  userRole: "teacher" | "student" | string;
  /** Current user's display name */
  userName: string;
  /** The student ID on the notebook (needed for endCall cleanup) */
  studentId: string;
  /** Called when the user confirms joining */
  onJoin: () => Promise<void>;
  /** Label for the join button */
  joinLabel: string;
  /** Current notebook ID */
  notebookId: string;
}

export const JoinUI: React.FC<JoinUIProps> = ({
  userRole,
  userName,
  studentId,
  onJoin,
  joinLabel,
  notebookId,
}) => {
  const { useCallSession } = useCallStateHooks();
  const sessionCall = useCallSession();
  const call = useCall();
  const { callState, clearCall } = useCallStore();
  const isMobile = useIsMobile();

  const uniqueParticipants =
    sessionCall?.participants.filter(
      (participant, index, self) =>
        index === self.findIndex((p) => p.user.id === participant.user.id),
    ) || [];

  const handleCancel = async () => {
    try {
      await call?.endCall();
    } catch {
      // Stream call may already be ended — safe to ignore
    } finally {
      try {
        if (userRole === "teacher" && callState?.callId) {
          await endCallAction({
            studentId,
            callId: callState.callId,
            notebookId,
          });
        } else if (userRole === "student") {
          await leaveCallAction({ studentId });
        }
      } catch {
        // Action errors are masked by safe-action
      }
      clearCall();
      showCanceledCallToast();
    }
  };

  return (
    <StreamTheme>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_event, info) => {
          if (info.offset.x > 100) handleCancel();
        }}
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={getGlassContainerClasses(isMobile)}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-16 bg-slate-300 dark:bg-slate-700 rounded-full opacity-50" />
        <div className="flex flex-col items-center justify-center h-full p-6 space-y-8 relative">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {userRole === "teacher" ? "Sala de Aula" : "Pronto?"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {userRole === "teacher"
                ? "Prepare-se para ensinar"
                : `Olá, ${userName.split(" ")[0]}`}
            </p>
          </div>
          <div className="flex -space-x-4 items-center justify-center py-4">
            {uniqueParticipants.length > 0 ? (
              uniqueParticipants.map((p) => (
                <div
                  key={p.user.id}
                  className="relative z-10 border-4 border-white dark:border-slate-900 rounded-full"
                >
                  <Avatar
                    name={p.user.name}
                    imageSrc={p.user.image}
                    style={{ width: 64, height: 64, borderRadius: "100%" }}
                  />
                </div>
              ))
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-pulse">
                <span className="text-2xl">👋</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <Button
              onClick={onJoin}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-6 font-bold text-lg"
            >
              {joinLabel}
            </Button>
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-muted-foreground hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </motion.div>
    </StreamTheme>
  );
};
