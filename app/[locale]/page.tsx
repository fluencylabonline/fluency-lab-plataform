import { LandingView } from "./_components/LandingView";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "@/i18n/navigation";

export default async function Home() {
  const user = await getCurrentUser();
  return <LandingView user={user} />;
}
