import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { User } from "./user.schema";

interface UserState {
  user: User | null;
  hasHydrated: boolean;
}

interface UserActions {
  setUser: (user: User | null) => void;
  clearUser: () => void;
  setHasHydrated: (state: boolean) => void;
}

export type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
