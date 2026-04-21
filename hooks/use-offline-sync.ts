"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { offlineStorage, type OfflinePractice } from "@/modules/learning/learning.offline";
import { syncPracticeBatchAction } from "@/modules/learning/learning.actions";
import { notify } from "@/components/ui/toaster";

interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  queueSize: number;
  setOnline: (status: boolean) => void;
  updateQueueSize: () => Promise<void>;
  syncQueue: () => Promise<void>;
  savePractice: (practice: Omit<OfflinePractice, "id" | "practicedAt">) => Promise<void>;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  queueSize: 0,

  setOnline: (status) => set({ isOnline: status }),

  updateQueueSize: async () => {
    const queue = await offlineStorage.getQueue();
    set({ queueSize: queue.length });
  },

  savePractice: async (practice) => {
    const { isOnline } = get();

    if (isOnline) {
      // In a real implementation, we could just call the action directly.
      // But for robustness, we can always try the action and fallback to queue on failure.
      return;
    }

    // Save to offline queue
    await offlineStorage.addToQueue({
      ...practice,
      practicedAt: new Date().toISOString(),
    });

    // Register background sync if available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Use unknown cast to safely access 'sync' without conflicting with global types
        const syncReg = registration as unknown as { sync: { register: (tag: string) => Promise<void> } };
        await syncReg.sync.register("sync-practice-queue");
      } catch (err) {
        console.warn("[OFFLINE SYNC] Background Sync registration failed:", err);
      }
    }

    await get().updateQueueSize();
    notify.info("Atividade salva localmente (Offline)");
  },

  syncQueue: async () => {
    const { isSyncing, isOnline, updateQueueSize } = get();
    if (isSyncing || !isOnline) return;

    const queue = await offlineStorage.getQueue();
    if (queue.length === 0) return;

    set({ isSyncing: true });

    try {
      const result = await syncPracticeBatchAction({
        items: queue.map(p => ({
          itemId: p.itemId,
          lessonId: p.lessonId,
          quality: p.quality,
          practicedAt: p.practicedAt,
        }))
      });

      if (result?.data?.count) {
        await offlineStorage.clearQueue();
        notify.success(`${result.data.count} práticas sincronizadas!`);
      }
    } catch (error) {
      console.error("[OFFLINE SYNC] Failed to sync queue:", error);
    } finally {
      set({ isSyncing: false });
      await updateQueueSize();
    }
  },
}));

/**
 * Hook to manage offline synchronization.
 * Automatically triggers sync when coming back online.
 */
export function useOfflineSync() {
  const { isOnline, isSyncing, queueSize, setOnline, syncQueue, updateQueueSize, savePractice } = useOfflineSyncStore();

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncQueue();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for messages from SW
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "SYNC_QUEUE") {
        syncQueue();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleMessage);

    // Initial check
    updateQueueSize();
    if (isOnline) syncQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      navigator.serviceWorker?.removeEventListener("message", handleMessage);
    };
  }, [setOnline, syncQueue, updateQueueSize, isOnline]);

  return {
    isOnline,
    isSyncing,
    queueSize,
    savePractice,
    syncQueue
  };
}
