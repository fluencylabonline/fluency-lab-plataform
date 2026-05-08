import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { notebookService } from "@/modules/notebook/notebook.service";
import { NotebookEditor } from "./_components/NotebookEditor";
import { Metadata } from "next";

interface NotebookPageProps {
  params: Promise<{ notebookId: string; locale: string }>;
}

import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: NotebookPageProps): Promise<Metadata> {
  const { notebookId, locale } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let notebook;
  try {
    notebook = await notebookService.getNotebook(user.id, user.role, notebookId);
  } catch {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Metadata.notebook" });

  return {
    title: notebook.title,
    description: t("description", { title: notebook.title }),
  };
}

function colorFromString(str: string): string {
  const colors = [
    "#E53E3E", "#DD6B20", "#D69E2E", "#38A169",
    "#3182CE", "#805AD5", "#D53F8C", "#00B5D8",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default async function NotebookPage({ params }: NotebookPageProps) {
  const { notebookId } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  let notebook;
  try {
    notebook = await notebookService.getNotebook(user.id, user.role, notebookId);
  } catch {
    notFound();
  }

  return (
    <NotebookEditor
      notebookId={notebookId}
      studentId={notebook.studentId}
      userId={user.id}
      userName={user.name}
      userRole={user.role}
      userColor={colorFromString(user.id)}
      userPhotoUrl={user.photoUrl}
    />
  );
}
