import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { RecessActivityEditorClient } from "../_components/RecessActivityEditorClient";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";

interface EditRecessActivityPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function EditRecessActivityPage({ params }: EditRecessActivityPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const activity = await curriculumService.findLessonById(id);

  if (!activity || !activity.isRecessActivity) {
    notFound();
  }

  if (!user) {
    notFound();
  }

  // Security check: Teacher can only edit their own activities
  if (activity.teacherId !== user.id) {
    notFound();
  }

  const result = await getLanguagesAction({});
  const languages = result?.data || [];

  return (
    <RecessActivityEditorClient
      initialActivity={activity}
      languages={languages}
    />
  );
}
