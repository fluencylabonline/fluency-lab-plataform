import { getCurrentUser } from "@/lib/auth-server";
import { userService } from "@/modules/user/user.service";
import { redirect } from "next/navigation";
import { PendingCancellationContent } from "./_components/PendingCancellationContent";

export default async function PendingCancellationPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");

  const user = await userService.getUser(sessionUser.id);
  if (!user || !user.cancellationPending) {
    redirect("/hub");
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <PendingCancellationContent user={user} />
    </main>
  );
}
