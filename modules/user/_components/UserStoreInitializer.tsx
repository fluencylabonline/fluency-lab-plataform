"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "../user.store";
import { User } from "../user.schema";

interface UserStoreInitializerProps {
  user: User | null;
}

export function UserStoreInitializer({ user }: UserStoreInitializerProps) {
  const initialized = useRef(false);

  if (!initialized.current && user) {
    useUserStore.getState().setUser(user);
    initialized.current = true;
  }

  useEffect(() => {
    if (user) {
      useUserStore.getState().setUser(user);
    }
  }, [user]);

  return null;
}
