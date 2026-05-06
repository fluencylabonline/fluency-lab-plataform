import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { schedulingRepository } from "@/modules/scheduling/scheduling.repository";
import { ConvertClassForm } from "./_components/ConvertClassForm";
import { userRepository } from "@/modules/user/user.repository";

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
    <main className="container">
      <ConvertClassForm 
        classData={{
          id: slot.id,
          startAt: slot.startAt,
          studentName: student?.name || "Aluno",
        }} 
      />
    </main>
  );
}
