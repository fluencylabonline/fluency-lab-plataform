import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { schedulingRepository } from "@/modules/scheduling/scheduling.repository";
import { ConvertClassForm } from "./_components/ConvertClassForm";
import { userRepository } from "@/modules/user/user.repository";
import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function ConvertClassPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  
  if (!user) {
    // Redirect to signin and then back to this page
    redirect(`/signin?redirectTo=/convert-class/${id}`);
  }

  const slot = await schedulingRepository.findById(id);
  if (!slot) notFound();

  // RBAC check: Only teacher of the class, or admin/manager can convert
  const isTeacherOfSlot = slot.teacherId === user.id;
  const isAdmin = user.role === "admin" || user.role === "manager";

  if (!isTeacherOfSlot && !isAdmin) {
    redirect("/hub");
  }

  // Ensure it's not already converted and is a student-canceled class
  if (slot.convertedToAvailableSlot || slot.status !== "canceled-student") {
     // Already handled or invalid status for conversion
     redirect("/hub");
  }

  const student = slot.studentId ? await userRepository.findById(slot.studentId) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 w-full border-b bg-background">
        <div className="flex h-fit items-center justify-between">
          <BackButton href="/hub/teacher/schedule" />
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </header>
      <main className="container max-w-2xl py-12 px-4">
    
      <ConvertClassForm 
        classData={{
          id: slot.id,
          startAt: slot.startAt,
          studentName: student?.name || "Aluno",
        }} 
      />
    </main>
    </div>
  );
}
