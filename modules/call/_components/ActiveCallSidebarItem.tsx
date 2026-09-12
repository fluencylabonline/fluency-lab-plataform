"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { twMerge } from "tailwind-merge";
import { Video } from "lucide-react";
import { useUserStore } from "@/modules/user/user.store";
import { useCallStore } from "@/hooks/data/use-call-store";

interface ActiveCallSidebarItemProps {
  isCollapsed: boolean;
}

/**
 * ActiveCallSidebarItem — desktop sidebar entry for a call the student
 * dismissed (canceled the join screen, or left by mistake / lost
 * connection). The call itself stays active (see useCallStore.hidePanel) —
 * this is just a way back in, styled and positioned like a regular sidebar
 * item (below "Configurações", the same as any other nav entry).
 *
 * Not rendered on the call's own notebook page: FloatCallButton already
 * shows an equivalent "Entrar na aula" button there.
 */
export function ActiveCallSidebarItem({ isCollapsed }: ActiveCallSidebarItemProps) {
  const user = useUserStore((s) => s.user);
  const callState = useCallStore((s) => s.callState);
  const isPanelHidden = useCallStore((s) => s.isPanelHidden);
  const showPanel = useCallStore((s) => s.showPanel);
  const pathname = usePathname();

  if (!user || user.role !== "student" || !callState || !isPanelHidden) {
    return null;
  }

  if (pathname?.includes(`/notebook/${callState.notebookId}`)) {
    return null;
  }

  return (
    <motion.button
      onClick={showPanel}
      whileHover={{ x: isCollapsed ? 0 : 4, scale: isCollapsed ? 1.05 : 1 }}
      whileTap={{ scale: 0.95 }}
      className={twMerge(
        "flex items-center w-full h-12 px-3 py-3 rounded-lg text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 font-semibold animate-pulse transition-all ease-in-out duration-300",
        isCollapsed && "justify-center px-3",
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center shrink-0">
        <Video className="w-5 h-5" />
      </div>
      <AnimatePresence>
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            className="ml-3 whitespace-nowrap overflow-hidden text-sm"
          >
            Chamada ativa — entrar
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
