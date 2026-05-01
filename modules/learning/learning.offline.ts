import { get, set, del } from "idb-keyval";

export interface OfflinePractice {
  id: string;
  itemId: string;
  lessonId: string;
  quality: number;
  practicedAt: string; // ISO string
}

const QUEUE_KEY = "learning_practice_queue";

export const offlineStorage = {
  /**
   * Adds a practice result to the local offline queue.
   */
  async addToQueue(practice: Omit<OfflinePractice, "id">) {
    const queue = await this.getQueue();
    const newPractice: OfflinePractice = {
      ...practice,
      id: crypto.randomUUID(),
    };
    await set(QUEUE_KEY, [...queue, newPractice]);
    return newPractice;
  },

  /**
   * Gets all results currently in the queue.
   */
  async getQueue(): Promise<OfflinePractice[]> {
    const queue = await get<OfflinePractice[]>(QUEUE_KEY);
    return queue || [];
  },

  /**
   * Clears the queue after successfull synchronization.
   */
  async clearQueue() {
    await del(QUEUE_KEY);
  },

  /**
   * Removes specific items from the queue.
   */
  async removeFromQueue(ids: string[]) {
    const queue = await this.getQueue();
    const filtered = queue.filter((p) => !ids.includes(p.id));
    await set(QUEUE_KEY, filtered);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Convenience helpers for the PracticeSession component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Queues a single practice result for offline storage.
 * Matches the shape of PracticeResult from learning.types.
 */
export async function queuePracticeResult(result: {
  itemId: string;
  lessonId: string;
  grade: number;
  type: string;
  timestamp: Date;
}) {
  return offlineStorage.addToQueue({
    itemId: result.itemId,
    lessonId: result.lessonId,
    quality: result.grade,
    practicedAt: result.timestamp.toISOString(),
  });
}

/**
 * Attempts to flush all queued practice results to the server.
 * Import syncPracticeBatchAction from learning.actions when ready.
 */
export async function flushPracticeQueue() {
  const queue = await offlineStorage.getQueue();
  if (queue.length === 0) return;

  try {
    // TODO: call syncPracticeBatchAction({ results: queue }) when implemented
    console.log(`[offline] Would flush ${queue.length} practice results`);
    // await syncPracticeBatchAction({ results: queue });
    // await offlineStorage.clearQueue();
  } catch (error) {
    console.warn("[offline] Failed to flush queue:", error);
  }
}
