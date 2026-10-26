import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { trialCallService } from "@/modules/trial-call/trial-call.service";
import { TrialClassesSection } from "@/app/[locale]/hub/admin/students/onboarding/_components/TrialClassesSection";
import { ProfilesPageClient } from "@/app/[locale]/hub/admin/students/onboarding/_components/ProfilesPageClient";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.onboarding" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AdminOnboardingProfilesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("/hub");
  }

  const [profiles, trialRooms] = await Promise.all([learningService.getAllProfiles(), trialCallService.listForAdmin()]);

  const formattedProfiles = profiles.map(p => ({
    id: p.id,
    studentId: p.studentId,
    status: p.status,
    updatedAt: p.updatedAt,
    student: p.student ? {
      name: p.student.name,
      email: p.student.email
    } : null
  }));

  const basePath = "/hub/admin/students/onboarding";
  return (
    <ProfilesPageClient
      initialData={formattedProfiles}
      basePath={basePath}
      trialSection={<TrialClassesSection rooms={trialRooms} basePath={basePath} />}
    />
  );
}
