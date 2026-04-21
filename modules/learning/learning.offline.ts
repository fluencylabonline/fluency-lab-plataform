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
