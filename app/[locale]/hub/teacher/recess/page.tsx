import { Header } from "@/components/layout/header";
import { curriculumService } from "@/modules/curriculum/curriculum.service";
import { getCurrentUser } from "@/lib/auth-server";
import { EmptyResults } from "@/components/ui/empty";
import { RecessActivityList } from "./_components/RecessActivityList";
import { Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

export default async function RecessActivitiesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const activities = await curriculumService.getRecessActivities(user.id);

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0">
      <Header
        title="Biblioteca de Recesso"
        subtitle="Atividades de fallback para garantir o engajamento dos alunos durante suas ausências"
        className="contents"
        backHref="/hub/teacher/schedule"
        actions={[
          {
            label: "Criar atividade",
            icon: <Plus className="w-4 h-4" />,
            //onClick: () => router.push("/produtos/novo"),
          },
        ]}
      />

      <main className="flex-1 p-4 md:p-6 container max-w-7xl mx-auto space-y-8">
        {/* Call to Action Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-primary/10 rounded-md">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-xl tracking-tight">
                Comunique seu Recesso
              </h3>
              <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
                Planejando um descanso? Informe as datas com 20 dias de
                antecedência para garantir a validação automática do seu SLA.
              </p>
            </div>
          </div>
          <Link
            href="/hub/teacher/my-schedule"
            className={buttonVariants({
              variant: "default",
              className:
                "gap-2 h-11 px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all",
            })}
          >
            Comunicar Agora
          </Link>
        </div>

        {/* SLA Reminder */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-200 dark:border-amber-900/50">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
          <p className="text-xs md:text-sm text-amber-800 dark:text-amber-400 font-medium leading-tight">
            <span className="font-bold">Atenção:</span> Para cada aluno afetado,
            você deve selecionar uma atividade de fallback desta biblioteca.
            Atividades globais estão disponíveis, mas você pode criar as suas
            próprias.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">
                Atividades Disponíveis
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Lições marcadas como conteúdo de fallback para períodos de
                recesso.
              </p>
            </div>
            <div className="text-sm font-semibold bg-muted px-3 py-1.5 rounded-full border border-border/50">
              {activities.length}{" "}
              {activities.length === 1 ? "atividade" : "atividades"}
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="py-12 bg-muted/20 rounded-3xl border-2 border-dashed border-border/50">
              <EmptyResults
                title="Nenhuma atividade encontrada"
                description="Você ainda não tem atividades de recesso vinculadas. Peça ao seu coordenador para liberar atividades globais ou crie novas lições marcadas como 'Atividade de Recesso'."
              />
            </div>
          ) : (
            <RecessActivityList activities={activities} />
          )}
        </div>
      </main>
    </div>
  );
}
