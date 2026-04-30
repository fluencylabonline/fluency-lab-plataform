import { learningService } from "@/modules/learning/learning.service";
import { StudentProfileSurvey } from "@/app/[locale]/hub/manager/students/_components/StudentProfileSurvey";
import { notFound } from "next/navigation";
import { type StudentProfileSurveyInput } from "@/modules/learning/learning.schema";

interface OnboardingPageProps {
  params: Promise<{
    profileId: string;
    locale: string;
  }>;
  searchParams: Promise<{
    studentId?: string;
    step?: string;
  }>;
}

export default async function OnboardingPage({ params, searchParams }: OnboardingPageProps) {
  const { profileId } = await params;
  const { studentId, step } = await searchParams;
  const isNew = profileId === "new";
  let initialData: StudentProfileSurveyInput | undefined = undefined;

  if (!isNew) {
    const profile = await learningService.findProfileById(profileId);
    if (!profile) notFound();
    initialData = profile.responses as StudentProfileSurveyInput;
  }

  return (
    <StudentProfileSurvey
      profileId={isNew ? undefined : profileId}
      studentId={studentId}
      initialData={initialData}
      initialStep={step ? parseInt(step) : 0}
    />
  );
}
