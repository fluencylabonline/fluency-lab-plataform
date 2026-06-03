import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { ProfilesPageClient } from "@/app/[locale]/hub/manager/students/onboarding/_components/ProfilesPageClient";
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

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/hub");
  }

  const profiles = await learningService.getAllProfiles();

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

  return <ProfilesPageClient initialData={formattedProfiles} basePath="/hub/admin/students/onboarding" />;
}
