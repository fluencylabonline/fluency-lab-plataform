import { redirect } from "next/navigation";
import { LandingView } from "./_components/LandingView";
import { getCurrentUser } from "@/lib/auth-server";
import { settingsService } from "@/modules/settings/settings.service";
import { userService } from "@/modules/user/user.service";

export default async function Home() {
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    settingsService.getSettings(),
  ]);

  if (user) {
    if (!user.isActive) {
      redirect("/suspended");
    }
    if (user.cancellationPending) {
      redirect("/pending-cancellation");
    }
  }

  return (
    <>
      {/* Só a landing usa o pôster: pré-carregar no layout raiz disputava banda
          com o LCP de todas as outras páginas. */}
      <link rel="preload" as="image" href="/videos/landing-poster.webp" fetchPriority="high" />
      <LandingView user={user ? userService.toSessionDTO(user) : null} settings={settings} />
    </>
  );
}
