import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { SessionUserDTO } from "./user.schema";

interface UserState {
  user: SessionUserDTO | null;
  hasHydrated: boolean;
}

interface UserActions {
  setUser: (user: SessionUserDTO | null) => void;
  clearUser: () => void;
  setHasHydrated: (state: boolean) => void;
}

export type UserStore = UserState & UserActions;

/**
 * Este store vai para o localStorage. Quem chama `setUser` às vezes ainda tem
 * o usuário completo do banco em mãos, então copiamos só os campos de sessão
 * aqui, em tempo de execução, em vez de confiar no tipo.
 */
function toSessionUser(user: SessionUserDTO | null | undefined): SessionUserDTO | null {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl ?? null,
    locale: user.locale ?? "pt",
    mfaEnabled: !!user.mfaEnabled,
    pwaInstalled: !!user.pwaInstalled,
  };
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setUser: (user) => set({ user: toSessionUser(user) }),
      clearUser: () => set({ user: null }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
      // v0 gravava a linha inteira de `users` (documentos, PIX, mfaSecret...).
      // A migração reescreve o que já está salvo nos aparelhos.
      version: 1,
      migrate: (persisted) => ({
        user: toSessionUser((persisted as { user?: SessionUserDTO | null } | null)?.user),
      }),
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
