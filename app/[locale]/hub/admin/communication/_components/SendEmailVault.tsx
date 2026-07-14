"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton,
  VaultSecondaryButton,
  VaultForm,
  VaultField,
  VaultInput
} from "@/components/ui/vault";
import { Textarea } from "@/components/ui/textarea";
import { sendAdminEmailSchema, SendAdminEmailValues } from "@/modules/communication/communication.schema";
import { sendAdminEmailAction } from "@/modules/communication/communication.actions";
import { searchUsersAction } from "@/modules/user/user.actions";
import { useSearch } from "@/hooks/data/use-search";
import { useState } from "react";
import { notify } from "@/components/ui/toaster";
import { User } from "@/modules/user/user.schema";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SendEmailVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyTo?: { email: string; subject: string } | null;
}

export function SendEmailVault({ open, onOpenChange, replyTo }: SendEmailVaultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { results: searchResults, isSearching } = useSearch<User>(searchTerm, searchUsersAction, { domain: "users" });

  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<SendAdminEmailValues>({
    resolver: zodResolver(sendAdminEmailSchema),
    values: replyTo ? {
      to: replyTo.email,
      subject: replyTo.subject.startsWith("Re:") ? replyTo.subject : `Re: ${replyTo.subject}`,
      body: "",
    } : undefined,
  });

  const onSubmit = async (data: SendAdminEmailValues) => {
    setIsLoading(true);
    try {
      const result = await sendAdminEmailAction(data);
      if (result?.data?.success) {
        notify.success("E-mail enviado com sucesso!");
        reset();
        setSearchTerm("");
        onOpenChange(false);
      } else {
        const errorMsg = result?.data?.error || result?.serverError || "Erro ao enviar e-mail";
        notify.error(errorMsg);
      }
    } catch {
      notify.error("Erro inesperado ao enviar e-mail");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectStudent = (student: User) => {
    if (student.email) {
      setValue("to", student.email);
      setSearchTerm("");
      notify.info(`Destinatário definido como: ${student.name}`);
    } else {
      notify.error("Este usuário não possui e-mail cadastrado");
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>{replyTo ? "Responder E-mail" : "Escrever Novo E-mail"}</VaultTitle>
          <VaultDescription>
            {replyTo 
              ? `Respondendo para ${replyTo.email}` 
              : "Envie um e-mail transacional ou personalizado para seus alunos ou qualquer endereço de e-mail."}
          </VaultDescription>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={handleSubmit(onSubmit)}>
            {!replyTo && (
              <div className="space-y-2 border-b pb-4 mb-4">
                <label className="text-xs font-semibold text-muted-foreground">Procurar Aluno (Opcional)</label>
                <Command shouldFilter={false} className="rounded-md border border-gray-200/50 dark:border-gray-700/50">
                  <CommandInput
                    placeholder="Busque por nome, e-mail ou telefone do aluno..."
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList className="max-h-[150px]">
                    {isSearching && (
                      <div className="p-3 text-center text-xs text-muted-foreground italic">
                        Buscando alunos...
                      </div>
                    )}

                    {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                      <CommandEmpty className="p-3 text-center text-xs text-muted-foreground">
                        Nenhum aluno encontrado
                      </CommandEmpty>
                    )}

                    <CommandGroup>
                      {searchResults.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleSelectStudent(user)}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-primary/5"
                        >
                          <div className="shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-xs font-medium truncate">{user.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                          </div>
                          <Badge variant="outline" className="text-[8px] h-4">Selecionar</Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}

            <VaultField label="Para (Destinatário)" error={errors.to?.message}>
              <VaultInput 
                {...register("to")} 
                placeholder="exemplo@email.com" 
                disabled={!!replyTo}
              />
            </VaultField>

            <VaultField label="Assunto" error={errors.subject?.message}>
              <VaultInput {...register("subject")} placeholder="Assunto do e-mail..." />
            </VaultField>

            <VaultField label="Conteúdo do E-mail" error={errors.body?.message}>
              <Textarea
                {...register("body")}
                placeholder="Escreva a mensagem aqui..."
                className="rounded-md bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[180px] text-sm"
              />
            </VaultField>
          </VaultForm>
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            Cancelar
          </VaultSecondaryButton>
          <VaultPrimaryButton onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? "Enviando..." : replyTo ? "Enviar Resposta" : "Enviar E-mail"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
