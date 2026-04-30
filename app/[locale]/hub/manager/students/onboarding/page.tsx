import { getCurrentUser } from "@/lib/auth-server";
import { learningService } from "@/modules/learning/learning.service";
import { ProfilesPageClient } from "./_components/ProfilesPageClient";
import { redirect } from "next/navigation";

//TODO: COLOCAR NAS OUTRAS PÁGINAS TAMBÉM
export const metadata = {
  title: "Perfis Adaptativos | FluencyLab",
  description: "Gerencie os perfis pedagógicos dos alunos.",
};

export default async function OnboardingProfilesPage() {
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

  return <ProfilesPageClient initialData={formattedProfiles} />;
}
