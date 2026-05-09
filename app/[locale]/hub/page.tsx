import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";

/**
 * Hub Redirector Page
 * 
 * This page serves as a landing point for the /hub route.
 * It detects the user's role and redirects them to their specific dashboard.
 * Runs in the Node.js runtime, allowing for database and firebase-admin access.
 */
export default async function HubPage() {
  const user = await getCurrentUser();

  // Basic security check (should already be handled by layout/middleware, but good for safety)
  if (!user) {
    redirect("/signin");
  }

  // Role-based routing table
  const roleRoutes: Record<string, string> = {
    [UserRoles.ADMIN]: "admin",
    [UserRoles.TEACHER]: "teacher",
    [UserRoles.STUDENT]: "student",
    [UserRoles.MANAGER]: "manager",
  };

  // Determine destination based on role, fallback to student dashboard
  const route = roleRoutes[user.role] || "student";

  // Perform the redirection
  redirect(`/hub/${route}/profile`);
}