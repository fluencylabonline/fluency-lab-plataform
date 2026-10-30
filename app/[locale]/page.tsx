import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { env } from "@/env/client";
import { LandingView } from "./_components/LandingView";
import { getCurrentUser } from "@/lib/auth-server";
import { settingsService } from "@/modules/settings/settings.service";
import { userService } from "@/modules/user/user.service";

export async function generateMetadata(): Promise<Metadata> {
  return { alternates: { canonical: "/" } };
}

export default async function Home() {
  const t = await getTranslations("Metadata.root");
  const baseUrl = env.NEXT_PUBLIC_APP_URL;

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
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": `${baseUrl}/#organization`,
              name: "FluencyLab",
              url: baseUrl,
              logo: `${baseUrl}/brand/logo.png`,
              description: t("description"),
            },
            {
              "@type": "WebSite",
              "@id": `${baseUrl}/#website`,
              name: "FluencyLab",
              url: baseUrl,
              publisher: { "@id": `${baseUrl}/#organization` },
            },
          ],
        }}
      />
      <LandingView user={user ? userService.toSessionDTO(user) : null} settings={settings} />
    </>
  );
}
