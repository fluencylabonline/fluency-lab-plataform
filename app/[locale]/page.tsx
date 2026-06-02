import { redirect } from "next/navigation";
import { LandingView } from "./_components/LandingView";
import { getCurrentUser } from "@/lib/auth-server";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    if (!user.isActive) {
      redirect("/suspended");
    }
    if (user.cancellationPending) {
      redirect("/pending-cancellation");
    }
  }

  return <LandingView user={user} />;
}

