import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { redirect, notFound } from "next/navigation";
import { ProfileDiagnosisView } from "./_components/ProfileDiagnosisView";

export const metadata = {
  title: "Diagnóstico Pedagógico | FluencyLab",
};

interface DiagnosisPageProps {
  params: Promise<{
    locale: string;
    profileId: string;
  }>;
}

export default async function ProfileDiagnosisPage({ params }: DiagnosisPageProps) {
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
    redirect(`/hub/manager/students/onboarding/${profileId}`);
  }

  return (
    <ProfileDiagnosisView
      profile={JSON.parse(JSON.stringify(profile))}
    />
  );
}
