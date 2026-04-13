import { create } from "zustand";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaStore {
  deferredPrompt: BeforeInstallPromptEvent | null;
  updateAvailable: boolean;
  isStandalone: boolean;
  registration: ServiceWorkerRegistration | null;
  setDeferredPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setUpdateAvailable: (available: boolean) => void;
  setStandalone: (isStandalone: boolean) => void;
  setRegistration: (reg: ServiceWorkerRegistration | null) => void;
  install: () => Promise<void>;
  update: () => void;
}

export const usePwaStore = create<PwaStore>((set, get) => ({
  deferredPrompt: null,
  updateAvailable: false,
  isStandalone: false,
  registration: null,

  setDeferredPrompt: (prompt) => set({ deferredPrompt: prompt }),
  setUpdateAvailable: (available) => set({ updateAvailable: available }),
  setStandalone: (isStandalone) => set({ isStandalone }),
  setRegistration: (reg) => set({ registration: reg }),

  install: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      set({ deferredPrompt: null });
    }
  },

  update: () => {
    const { registration } = get();
    if (!registration || !registration.waiting) {
        window.location.reload();
        return;
    }

    // Send the skip waiting message to the waiting service worker
    registration.waiting.postMessage({ type: "SKIP_WAITING" });

    // Listen for the controlling service worker to change and reload the page
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  },
}));
