"use client";

import { useState } from "react";
import { Procedure } from "@/modules/procedure/procedure.types";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { type JSONContent } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import { Edit2, Save, X } from "lucide-react";
import { updateProcedureAction } from "@/modules/procedure/procedure.actions";
import { notify } from "@/components/ui/toaster";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProcedureEditorProps {
  initialData: Procedure;
}

export function ProcedureEditor({ initialData }: ProcedureEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<JSONContent>(initialData.content);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const promise = updateProcedureAction({
      procedureId: initialData.id,
      content,
    });

    notify.promise(promise, {
      loading: "Salvando alterações...",
      success: (result) => {
        setIsSaving(false);
        if (result?.data?.success) {
          setIsEditing(false);
          return "Procedimento salvo com sucesso!";
        }
        throw new Error(result?.serverError || "Erro desconhecido");
      },
      error: (err: unknown) => {
        setIsSaving(false);
        return (err as Error)?.message || "Erro ao salvar procedimento";
      },
    });
  };

  const handleCancel = () => {
    setContent(initialData.content);
    setIsEditing(false);
  };

  return (
    <div className="overflow-hidden">
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-border bg-gray-50/50 dark:bg-gray-900/50">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Última atualização em {format(new Date(initialData.updatedAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          <p className="text-sm text-muted-foreground">
            Editado por {initialData.author?.name || "Usuário"}
          </p>
        </div>
        <div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="rounded-xl gap-2">
              <Edit2 className="h-4 w-4" />
              Editar Conteúdo
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="rounded-xl gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="rounded-xl gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="p-0">
        <RichTextEditor 
          content={content} 
          onChange={setContent} 
          editable={isEditing} 
        />
      </div>
    </div>
  );
}
