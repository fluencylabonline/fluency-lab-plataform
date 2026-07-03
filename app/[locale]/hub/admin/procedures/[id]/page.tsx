import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";
import { procedureService } from "@/modules/procedure/procedure.service";
import { ProcedureEditor } from "./_components/ProcedureEditor";
import { notFound } from "next/navigation";

interface ProcedurePageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: ProcedurePageProps) {
  const { id } = await params;
  const t = await getTranslations("Procedures");
  try {
    const procedure = await procedureService.getProcedureById(id);
    return {
      title: `${procedure.title} - ${t("title")}`,
    };
  } catch {
    return {
      title: t("title"),
    };
  }
}

export default async function ProcedurePage({ params }: ProcedurePageProps) {
  await requireRole(UserRoles.ADMIN);
  const { id, locale } = await params;
  let procedure;
  try {
    procedure = await procedureService.getProcedureById(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <Header
        title={procedure.title}
        showSubHeader={false}
        backHref={`/${locale}/hub/admin/procedures`}
      />
      <main>
        <ProcedureEditor initialData={procedure} />
      </main>
    </div>
  );
}
