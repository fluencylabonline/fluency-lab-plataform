import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { redirect, notFound } from "next/navigation";
import { ProfileDiagnosisView } from "@/app/[locale]/hub/manager/students/onboarding/[profileId]/view/_components/ProfileDiagnosisView";

import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.diagnosis" });
  return {
    title: t("title"),
  };
}

interface DiagnosisPageProps {
  params: Promise<{
    locale: string;
    profileId: string;
  }>;
}

export default async function AdminProfileDiagnosisPage({ params }: DiagnosisPageProps) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/hub");
  }

  const { profileId } = await params;
  const profile = await learningService.findProfileById(profileId);

  if (!profile) {
    notFound();
  }

  // If the profile is still a draft, redirect back to survey
  if (profile.status === "draft") {
    redirect(`/hub/admin/students/onboarding/${profileId}`);
  }

  return (
    <ProfileDiagnosisView
      profile={JSON.parse(JSON.stringify(profile))}
      basePath="/hub/admin/students/onboarding"
    />
  );
}
