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
    studentId: string;
  }>;
}

export default async function StudentProfileDiagnosisPage({ params }: DiagnosisPageProps) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "teacher" && user.role !== "admin" && user.role !== "manager")) {
    redirect("/signin");
  }

  const { studentId } = await params;
  const profile = await learningService.findProfileByStudentId(studentId);

  if (!profile) {
    notFound();
  }

  // If the profile is still a draft, redirect back to details
  if (profile.status === "draft") {
    redirect(`/hub/teacher/students/${studentId}`);
  }

  return (
    <ProfileDiagnosisView
      profile={JSON.parse(JSON.stringify(profile))}
      basePath={`/hub/teacher/students/${studentId}`}
      readOnly={true}
    />
  );
}
