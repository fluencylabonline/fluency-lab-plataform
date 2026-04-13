import { create } from "zustand";

interface NotificationStore {
  isDismissed: boolean;
  dismiss: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  isDismissed: false,
  dismiss: () => set({ isDismissed: true }),
}));
