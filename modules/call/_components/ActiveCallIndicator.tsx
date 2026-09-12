"use client";

import { usePathname } from "next/navigation";
import { Video } from "lucide-react";
import { useUserStore } from "@/modules/user/user.store";
import { useCallStore } from "@/hooks/data/use-call-store";

/**
 * ActiveCallIndicator — discreet floating icon (mobile only) for a call the
 * student dismissed (canceled the join screen, or left by mistake / lost
 * connection). The call itself stays active (see useCallStore.hidePanel) —
 * this just surfaces that it's still there.
 *
 * Desktop has its own equivalent, ActiveCallSidebarItem, rendered inside the
 * sidebar (below "Configurações") instead of floating over the page.
 *
 * Not rendered on the call's own notebook page: FloatCallButton already
 * shows an equivalent "Entrar na aula" button there.
 *
 * Mounted globally (in Providers), so it works everywhere else — hub pages
 * included, since students may be at any page when the call was dismissed.
 */
export function ActiveCallIndicator() {
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
    <button
      onClick={showPanel}
      title="Chamada ativa — toque para entrar"
      className="md:hidden fixed bottom-20 right-4 z-40 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg animate-pulse"
    >
      <Video size={20} />
    </button>
  );
}
