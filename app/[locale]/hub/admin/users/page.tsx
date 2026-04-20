import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "./_components/UsersPageClient";
import { hasPermission } from "@/lib/rbac";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user, "class.view.all")) {
    redirect("/signin");
  }

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 p-6">
        <UsersPageClient />
      </main>
    </div>
  );
}
