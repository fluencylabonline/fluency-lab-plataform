import { getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { getCurrentUser, requireRole } from "@/lib/auth-server";
import { UserRoles } from "@/lib/rbac";
import { procedureService } from "@/modules/procedure/procedure.service";
import { ProceduresList } from "./_components/ProceduresList";

export async function generateMetadata() {
  const t = await getTranslations("Procedures");
  return {
    title: t("title"),
  };
}

export default async function ProceduresPage() {
  const t = await getTranslations("Procedures");
  const user = await getCurrentUser();
  await requireRole(UserRoles.ADMIN);

  if (!user) return null;

  const procedures = await procedureService.getAllProcedures();

  return (
    <div>
      <Header
        title={t("title")}
        subtitle={t("description")}
      />
      <main className="container py-8">
        <ProceduresList initialData={procedures} />
      </main>
    </div>
  );
}
