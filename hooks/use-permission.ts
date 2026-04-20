"use client";

import { useUserStore } from "@/modules/user/user.store";
import { hasPermission, type Permission } from "@/lib/rbac";

/**
 * Hook to check if the current user has a specific permission.
 * Reactive to user store changes.
 * 
 * @param permission The permission to check
 * @returns boolean
 */
export function usePermission(permission: Permission): boolean {
  const user = useUserStore((state) => state.user);
  return hasPermission(user, permission);
}

/**
 * Hook to check multiple permissions.
 * @returns Object with check functions and current user role
 */
export function useRBAC() {
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  return {
    user,
    role: user?.role,
    hasPermission: (perm: Permission) => hasPermission(user, perm),
    hasHydrated,
    isAdmin: user?.role === "admin",
  };
}
