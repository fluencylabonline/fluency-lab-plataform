"use client";

import { motion } from "framer-motion";
import { Video } from "lucide-react";
import { useState } from "react";
import { useCallStore } from "@/hooks/data/use-call-store";
import { startCallAction } from "@/modules/call/call.actions";

interface FloatCallButtonProps {
  /** The notebook's student ID — used by the teacher to start a call */
  studentId: string;
  /** Current notebook ID — attached to the call for tracking */
  notebookId: string;
  /** Current user role — determines button behavior */
  userRole: string;
}

/**
 * FloatCallButton — Floating video call trigger button.
 *
 * Teacher: clicking starts a call → populates useCallStore → VideoCall renders.
 * Student: normally the call panel (GlobalVideoCall) shows up on its own via
 *          the Firestore listener. But if they dismissed it (canceled the
 *          join screen, or left an in-progress call by mistake / lost
 *          connection), this button becomes their "entrar na aula" — the
 *          panel is hidden, not the call itself, so clicking just re-shows it.
 */
export function FloatCallButton({
  studentId,
  notebookId,
  userRole,
}: FloatCallButtonProps) {
  const { callState, isPanelHidden, showPanel } = useCallStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isTeacher = userRole === "teacher" || userRole === "admin";
  const hasActiveCall = !!callState?.callId;

  if (isTeacher) {
    // Hide once a call is already active (the call panel is visible).
    if (hasActiveCall) return null;
  } else {
    // Nothing to join, or the panel is already visible — no button needed.
    if (!hasActiveCall || !isPanelHidden) return null;
  }

  const handleClick = async () => {
    if (!isTeacher) {
      showPanel();
      return;
    }

    if (isLoading || !studentId) return;

    setIsLoading(true);
    try {
      const result = await startCallAction({ studentId, notebookId });

      if (result?.data?.callState) {
        useCallStore.getState().setCallState({
          ...result.data.callState,
          studentId,
          notebookId,
        });
      }
    } catch (error) {
      console.error("[FloatCallButton] Failed to start call:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const label = isTeacher
    ? (isLoading ? "Iniciando..." : "Iniciar aula")
    : "Entrar na aula";

  return (
    <motion.div
      className="fixed bottom-16 lg:right-12 md:right-5 right-2 z-40"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.button
        className={`flex items-center gap-2 px-4 py-3 rounded-full overflow-hidden transition-all duration-300 ${
          isLoading
            ? "bg-indigo-400 text-white cursor-wait"
            : "bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
        }`}
        initial={{ width: 56 }}
        animate={{ width: isHovered ? 180 : 56 }}
        transition={{ type: "spring", stiffness: 360, damping: 28 }}
        onClick={handleClick}
        disabled={isLoading}
        layout
      >
        <motion.div
          className="flex items-center justify-center w-8 h-8"
          animate={
            !isLoading
              ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }
              : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Video className="w-5 h-5" />
          )}
        </motion.div>

        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{
            opacity: isHovered ? 1 : 0,
            width: isHovered ? "auto" : 0,
          }}
          className="whitespace-nowrap text-sm font-semibold"
        >
          {label}
        </motion.span>
      </motion.button>
    </motion.div>
  );
}
