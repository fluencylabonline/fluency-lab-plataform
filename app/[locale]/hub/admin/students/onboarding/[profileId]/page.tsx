import { learningService } from "@/modules/learning/learning.service";
import { StudentProfileSurvey } from "@/app/[locale]/hub/admin/students/_components/StudentProfileSurvey";
import { notFound } from "next/navigation";
import { type StudentProfileSurveyInput } from "@/modules/learning/learning.schema";
import { getCurrentUser } from "@/lib/auth-server";
import { redirect } from "next/navigation";

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

export default async function AdminOnboardingPage({ params, searchParams }: OnboardingPageProps) {
  //console.log("[AdminOnboardingPage] Entering page");
  const user = await getCurrentUser();
  //console.log("[AdminOnboardingPage] Current user role:", user?.role);

  if (!user || user.role !== "admin") {
    console.log("[AdminOnboardingPage] Access denied, redirecting to /hub");
    redirect("/hub");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  //console.log("[AdminOnboardingPage] Resolved params:", resolvedParams);
  //console.log("[AdminOnboardingPage] Resolved searchParams:", resolvedSearchParams);

  const { profileId } = resolvedParams;
  const { studentId, step } = resolvedSearchParams;
  const isNew = profileId === "new";
  //console.log("[AdminOnboardingPage] profileId:", profileId, "isNew:", isNew);
  let initialData: StudentProfileSurveyInput | undefined = undefined;

  if (!isNew) {
    //console.log("[AdminOnboardingPage] Fetching profile for id:", profileId);
    const profile = await learningService.findProfileById(profileId);
    //console.log("[AdminOnboardingPage] Found profile:", !!profile);
    if (!profile) {
      //console.log("[AdminOnboardingPage] Profile not found, calling notFound()");
      notFound();
    }
    initialData = profile.responses as StudentProfileSurveyInput;
  }

  return (
    <StudentProfileSurvey
      profileId={isNew ? undefined : profileId}
      studentId={studentId}
      initialData={initialData}
      initialStep={step ? parseInt(step) : 0}
      basePath="/hub/admin/students/onboarding"
    />
  );
}
