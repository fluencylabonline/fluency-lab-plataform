import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { AudioProfileImport } from "@/app/[locale]/hub/manager/students/_components/AudioProfileImport";

// Server Actions used on this page (audio analysis) can run for several minutes.
export const maxDuration = 300;

interface FromAudioPageProps {
  searchParams: Promise<{
    shared?: string;
    profileId?: string;
    studentId?: string;
  }>;
}

export default async function AdminOnboardingFromAudioPage({ searchParams }: FromAudioPageProps) {
  const user = await getCurrentUser();

  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    redirect("/hub");
  }

  const { shared, profileId, studentId } = await searchParams;

  return (
    <AudioProfileImport
      userId={user.id}
      basePath="/hub/admin/students/onboarding"
      profileId={profileId}
      studentId={studentId}
      openedByShare={shared === "1"}
    />
  );
}
