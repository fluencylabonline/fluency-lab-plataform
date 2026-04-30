"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import {
  Sparkles,
  User,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Search,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "@/i18n/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveProfileAction } from "@/modules/learning/learning.actions";
import { notify } from "@/components/ui/toaster";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton
} from "@/components/ui/vault";
import { useTransition } from "react";

interface Profile {
  id: string;
  studentId: string | null;
  status: string;
  updatedAt: Date | null;
  student?: {
    name: string | null;
    email: string | null;
  } | null;
}

interface ProfilesPageClientProps {
  initialData: Profile[];
}

export function ProfilesPageClient({ initialData }: ProfilesPageClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!profileToDelete) return;

    startTransition(async () => {
      const result = await archiveProfileAction({ profileId: profileToDelete });
      if (result?.data?.success) {
        notify.success("Perfil desativado com sucesso");
        setProfileToDelete(null);
      } else {
        notify.error(result?.data?.error || "Erro ao desativar perfil");
      }
    });
  };

  const filteredProfiles = initialData.filter(profile => {
    if (profile.status === "archived") return false;
    const studentName = profile.student?.name?.toLowerCase() || "";
    const studentEmail = profile.student?.email?.toLowerCase() || "";
    const searchTerm = search.toLowerCase();
    return studentName.includes(searchTerm) || studentEmail.includes(searchTerm);
  });

  return (
    <div>
      <Header
        title="Perfis Adaptativos"
        subtitle="Gerencie os perfis pedagógicos e diagnósticos dos seus alunos."
        onSearchChange={setSearch}
        action={{
          label: "Novo Perfil",
          icon: <Sparkles className="h-4 w-4" />,
          onClick: () => router.push("/hub/manager/students/onboarding/new")
        }}
        backHref="/hub/manager/users"
      />

      <div className="container">
        {/* Profiles Grid/List */}
        <div className="flex flex-col gap-2">
          {filteredProfiles.length > 0 ? (
            filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="card flex items-center gap-4 p-4 transition-all animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <User className="h-6 w-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">
                      {profile.student?.name || "Aluno não vinculado"}
                    </h3>
                    <Badge variant={profile.status === "active" ? "default" : "outline"} className={cn(
                      "text-[10px] uppercase tracking-wider py-0 px-1.5 h-4",
                      profile.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                    )}>
                      {profile.status === "active" ? "Ativo" : "Rascunho"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 truncate">
                      {profile.student?.email || "Nenhum e-mail"}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="h-3 w-3" />
                      {profile.updatedAt ? format(new Date(profile.updatedAt), "dd 'de' MMM", { locale: ptBR }) : "Nunca"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {profile.status === "active" && (
                    <Link
                      href={`/hub/manager/students/onboarding/${profile.id}/view`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex gap-2 rounded-md border-primary/20 text-primary hover:bg-primary/5")}
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Diagnóstico
                    </Link>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      {profile.status === "active" && (
                        <DropdownMenuItem asChild>
                          <Link href={`/hub/manager/students/onboarding/${profile.id}/view`} className="flex items-center gap-2 cursor-pointer">
                            <Eye className="h-4 w-4" /> Ver Diagnóstico
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/hub/manager/students/onboarding/${profile.id}`} className="flex items-center gap-2 cursor-pointer">
                          <Edit className="h-4 w-4" /> Editar Respostas
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!!profile.studentId}
                        onClick={() => setProfileToDelete(profile.id)}
                      >
                        <Trash2 className="h-4 w-4" /> {profile.studentId ? "Excluir (Vinculado)" : "Excluir Perfil"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed border-muted">
              <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold mb-1">Nenhum perfil encontrado</h3>
              <p className="text-muted-foreground text-center max-w-xs mb-6">
                {search ? `Não encontramos perfis para "${search}"` : "Comece criando o primeiro perfil pedagógico de aluno."}
              </p>
              <Link
                href="/hub/manager/students/onboarding/new"
                className={cn(buttonVariants({ variant: "default" }), "gap-2 font-bold")}
              >
                <Sparkles className="h-4 w-4 fill-primary-foreground/20" /> Criar Primeiro Perfil
              </Link>
            </div>
          )}
        </div>
      </div>

      <Vault
        open={!!profileToDelete}
        onOpenChange={(open) => !open && setProfileToDelete(null)}
      >
        <VaultContent>
          <VaultHeader>
            <VaultTitle>Desativar Perfil</VaultTitle>
            <VaultDescription>
              Tem certeza que deseja desativar este perfil? Ele não aparecerá mais nas buscas, mas os dados históricos serão preservados.
            </VaultDescription>
          </VaultHeader>

          <VaultBody>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-destructive/10 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p className="text-sm font-medium">
                Apenas perfis sem alunos vinculados podem ser desativados.
              </p>
            </div>
          </VaultBody>

          <VaultFooter>
            <VaultSecondaryButton
              onClick={() => setProfileToDelete(null)}
              disabled={isPending}
            >
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Processando..." : "Confirmar Desativação"}
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
