import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { UsersPageClient } from "./_components/UsersPageClient";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
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
