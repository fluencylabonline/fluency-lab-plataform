"use client";

import { useEffect } from "react";
import { useUserStore } from "../user.store";
import type { SessionUserDTO } from "../user.schema";

interface UserStoreInitializerProps {
  user: SessionUserDTO | null;
}

export function UserStoreInitializer({ user }: UserStoreInitializerProps) {
  useEffect(() => {
    if (!user) return;

    const id = setTimeout(() => {
      useUserStore.getState().setUser(user);
    }, 0);

    return () => clearTimeout(id);
  }, [user]);

  return null;
}
