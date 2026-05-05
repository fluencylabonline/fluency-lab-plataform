"use client";

import { ReactNode } from "react";
import { useRBAC } from "@/hooks/rbac/use-permission";
import { Role } from "@/lib/rbac";
import { Shimmer } from "@shimmer-from-structure/react";

interface RoleGuardProps {
  /** The role(s) allowed to see the content */
  roles: Role | Role[];
  /** Content to show if role matches */
  children: ReactNode;
  /** Optional fallback to show if role doesn't match */
  fallback?: ReactNode;
  /** Props for the Shimmer during hydration */
  templateProps?: Record<string, unknown>;
}

/**
 * RoleGuard is used when you need to restrict content based on the Role specifically,
 * ignoring the general "admin has all permissions" logic.
 */
export function RoleGuard({
  roles,
  children,
  fallback = null,
  templateProps = {},
}: RoleGuardProps) {
  const { role, hasHydrated } = useRBAC();

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const canSee = role && allowedRoles.includes(role);

  if (!hasHydrated) {
    return (
      <Shimmer loading={true} templateProps={templateProps}>
        <div className="contents">{children}</div>
      </Shimmer>
    );
  }

  return canSee ? <>{children}</> : <>{fallback}</>;
}
