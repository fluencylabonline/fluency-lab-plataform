import { LandingView } from "./_components/LandingView";
import { getCurrentUser } from "@/lib/auth-server";

export default async function Home() {
  const user = await getCurrentUser();
  return <LandingView user={user} />;
}
