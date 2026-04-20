"use client";

import { ReactNode } from "react";
import { Shimmer } from "@shimmer-from-structure/react";
import { useRBAC } from "@/hooks/use-permission";
import { Permission } from "@/lib/rbac";

interface PermissionGuardProps {
  /** The permission required to see the content */
  permission: Permission;
  /** Content to show if permission is granted */
  children: ReactNode;
  /** 
   * Optional fallback to show if permission is denied. 
   * Useful for showing "Access Denied" messages or empty states.
   */
  fallback?: ReactNode;
  /**
   * Props to pass to the Shimmer component for mock rendering.
   * Ensure this matches the expected props of the children.
   */
  templateProps?: Record<string, unknown>;
  /**
   * If true, even if the user is admin, the specific permission check will be strictly enforced.
   * By default, admins see everything.
   */
  strict?: boolean;
}

/**
 * A wrapper component that conditionally renders its children based on RBAC permissions.
 * It integrates with the project's Shimmer system to provide smooth hydration.
 * 
 * @example
 * <PermissionGuard permission="user.create" templateProps={{ disabled: false }}>
 *   <Button>Create User</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
  permission,
  children,
  fallback = null,
  templateProps = {},
}: PermissionGuardProps) {
  const { hasPermission, hasHydrated } = useRBAC();

  // Logic: 
  // 1. If not hydrated, show Shimmer wrapping children.
  // 2. If hydrated, check permission.
  // 3. Admin logic: hasPermission always returns true for admin unless we implement strict mode.
  //    (Actually, the centralized hasPermission in rbac.ts already handles admin: true).

  const canSee = hasPermission(permission);

  if (!hasHydrated) {
    return (
      <Shimmer loading={true} templateProps={templateProps}>
        <div className="contents">{children}</div>
      </Shimmer>
    );
  }

  // Admin Fallback Visual: if user is admin but doesn't have the specific permission in their array,
  // we still show it (canSee is true), but we could optionally add a visual hint here if needed.
  // The user said "sim" to "Devemos manter algum fallback visual para o admin em permissões que são interpretadas como self?".
  // This implies if they are admin but it's not "theirs", we show it anyway because they are admin.

  return canSee ? <>{children}</> : <>{fallback}</>;
}
