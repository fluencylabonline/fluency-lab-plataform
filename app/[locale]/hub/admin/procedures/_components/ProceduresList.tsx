"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Search, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyResults } from "@/components/ui/empty";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Procedure } from "@/modules/procedure/procedure.types";
import { NewProcedureVault } from "./NewProcedureVault";
import { notify } from "@/components/ui/toaster";
import { deleteProcedureAction } from "@/modules/procedure/procedure.actions";
import { useRouter } from "@/i18n/navigation";
import { 
  Vault, 
  VaultContent, 
  VaultHeader, 
  VaultTitle, 
  VaultDescription, 
  VaultFooter, 
  VaultPrimaryButton, 
  VaultSecondaryButton,
  VaultIcon
} from "@/components/ui/vault";

interface ProceduresListProps {
  initialData: Procedure[];
}

export function ProceduresList({ initialData }: ProceduresListProps) {
  const [procedures, setProcedures] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  const router = useRouter();

  const filteredProcedures = procedures.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async () => {
    if (!procedureToDelete) return;

    const promise = deleteProcedureAction({ id: procedureToDelete.id });
    
    notify.promise(promise, {
      loading: "Excluindo procedimento...",
      success: (result) => {
        if (result?.data?.success) {
          setProcedures(prev => prev.filter(p => p.id !== procedureToDelete.id));
          setProcedureToDelete(null);
          return "Procedimento excluído com sucesso";
        }
        throw new Error(result?.serverError || "Erro desconhecido");
      },
      error: (err: unknown) => {
        return (err as Error)?.message || "Erro ao excluir procedimento";
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11 rounded-xl"
          />
        </div>
        <Button 
          onClick={() => setIsVaultOpen(true)}
          className="w-full md:w-auto h-11 rounded-xl gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo POP
        </Button>
      </div>

      {filteredProcedures.length === 0 ? (
        <div className="flex flex-col items-center gap-4">
          <EmptyResults
            title="Nenhum procedimento encontrado"
            description={searchTerm ? "Tente buscar com outros termos." : "Crie o seu primeiro Procedimento Operacional Padrão."}
          />
          {!searchTerm && (
            <Button onClick={() => setIsVaultOpen(true)} className="rounded-xl">
              Criar POP
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProcedures.map((procedure) => (
            <div 
              key={procedure.id}
              className="item flex flex-col p-5 rounded-2xl cursor-pointer"
              onClick={() => router.push(`/hub/admin/procedures/${procedure.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary/10 text-primary p-3 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg"
                    onClick={() => setProcedureToDelete(procedure)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {procedure.title}
              </h3>
              
              <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={procedure.author?.photoUrl || ""} />
                    <AvatarFallback name={procedure.author?.name || "U"}>{procedure.author?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[100px]">{procedure.author?.name || "Usuário"}</span>
                </div>
                <span>{format(new Date(procedure.updatedAt), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewProcedureVault 
        open={isVaultOpen} 
        onOpenChange={setIsVaultOpen} 
      />

      {/* Delete Confirmation Vault */}
      <Vault open={!!procedureToDelete} onOpenChange={(open) => !open && setProcedureToDelete(null)}>
        <VaultContent>
          <VaultIcon type="warning" />
          <VaultHeader>
            <VaultTitle>Excluir Procedimento?</VaultTitle>
            <VaultDescription>
              Tem certeza que deseja excluir o procedimento &quot;{procedureToDelete?.title}&quot;? Esta ação não pode ser desfeita.
            </VaultDescription>
          </VaultHeader>
          <VaultFooter>
            <VaultSecondaryButton onClick={() => setProcedureToDelete(null)}>
              Cancelar
            </VaultSecondaryButton>
            <VaultPrimaryButton 
              variant="destructive" 
              onClick={handleDelete}
            >
              Excluir
            </VaultPrimaryButton>
          </VaultFooter>
        </VaultContent>
      </Vault>
    </div>
  );
}
