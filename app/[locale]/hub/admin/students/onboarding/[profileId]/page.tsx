import { learningService } from "@/modules/learning/learning.service";
import { StudentProfileReview } from "@/app/[locale]/hub/admin/students/_components/StudentProfileReview";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";

interface ReviewPageProps {
  params: Promise<{
    profileId: string;
    locale: string;
  }>;
}

/** Revisão do perfil: os perfis nascem das aulas experimentais; aqui o admin confere, corrige e ativa. */
export default async function AdminProfileReviewPage({ params }: ReviewPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/hub");

  const { profileId } = await params;
  const profile = await learningService.findProfileById(profileId);
  if (!profile) notFound();

  return (
    <StudentProfileReview
      profileId={profile.id}
      initialData={profile.responses as Record<string, Record<string, unknown>>}
      basePath="/hub/admin/students/onboarding"
    />
  );
}
