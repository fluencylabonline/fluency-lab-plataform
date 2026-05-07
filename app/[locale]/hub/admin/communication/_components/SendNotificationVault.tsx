"use client";

import { useForm, Controller } from "react-hook-form";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { sendNotificationSchema, SendNotificationValues } from "@/modules/notification/notification.schema";
import { sendNotificationAction } from "@/modules/notification/notification.actions";
import { searchUsersAction } from "@/modules/user/user.actions";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem
} from "@/components/ui/command";
import { notify } from "@/components/ui/toaster";
import { User } from "@/modules/user/user.schema";
import { useSearch } from "@/hooks/data/use-search";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyResults } from "@/components/ui/empty";
import { X, Search, User as UserIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SendNotificationVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendNotificationVault({ open, onOpenChange }: SendNotificationVaultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const {
    results: searchResults,
    isSearching
  } = useSearch<User>(searchTerm, searchUsersAction, { domain: "users" });

  const { register, handleSubmit, watch, setValue, control, formState: { errors }, reset } = useForm<SendNotificationValues>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      targetType: "all",
      channels: {
        push: true,
        inApp: true,
      }
    }
  });

  const targetType = watch("targetType");

  const toggleUser = (user: User) => {
    const isSelected = selectedUsers.find(u => u.id === user.id);
    let newSelection;
    if (isSelected) {
      newSelection = selectedUsers.filter(u => u.id !== user.id);
    } else {
      newSelection = [...selectedUsers, user];
    }
    setSelectedUsers(newSelection);
    setValue("userIds", newSelection.map(u => u.id));
  };

  const removeUser = (userId: string) => {
    const newSelection = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelection);
    setValue("userIds", newSelection.map(u => u.id));
  };

  const onSubmit = async (data: SendNotificationValues) => {
    setIsLoading(true);
    try {
      const result = await sendNotificationAction(data);
      if (result?.data?.success) {
        notify.success("Notificação disparada com sucesso!");
        reset();
        setSelectedUsers([]);
        onOpenChange(false);
      } else {
        notify.error("Erro ao enviar notificação");
      }
    } catch {
      notify.error("Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>Disparar Notificação</VaultTitle>
          <VaultDescription>Envie uma mensagem instantânea via In-App e Push para seus usuários.</VaultDescription>
        </VaultHeader>

        <VaultBody>
          <VaultForm onSubmit={handleSubmit(onSubmit)}>
            <VaultField label="Título" error={errors.title?.message}>
              <VaultInput {...register("title")} placeholder="Ex: Nova Aula Disponível" />
            </VaultField>

            <VaultField label="Mensagem" error={errors.body?.message}>
              <Textarea
                {...register("body")}
                placeholder="Descreva o conteúdo da notificação..."
                className="rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[100px]"
              />
            </VaultField>

            <div className="grid grid-cols-2 gap-4">
              <VaultField label="Público-Alvo">
                <Select
                  onValueChange={(val) => setValue("targetType", val as SendNotificationValues["targetType"])}
                  defaultValue="all"
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Usuários</SelectItem>
                    <SelectItem value="role">Por Role (Cargo)</SelectItem>
                    <SelectItem value="specific">Usuários Específicos</SelectItem>
                  </SelectContent>
                </Select>
              </VaultField>

              {targetType === "role" && (
                <VaultField label="Selecione a Role">
                  <Select onValueChange={(val) => setValue("targetRole", val as SendNotificationValues["targetRole"])}>
                    <SelectTrigger className="rounded-xl h-10">
                      <SelectValue placeholder="Role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Alunos</SelectItem>
                      <SelectItem value="teacher">Professores</SelectItem>
                      <SelectItem value="manager">Gestores</SelectItem>
                    </SelectContent>
                  </Select>
                </VaultField>
              )}
            </div>

            {targetType === "specific" && (
              <VaultField label="Destinatários" error={errors.userIds?.message}>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-xl border border-dashed border-muted-foreground/30">
                    {selectedUsers.length === 0 ? (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Search className="w-3 h-3" /> Nenhum usuário selecionado
                      </span>
                    ) : (
                      selectedUsers.map(user => (
                        <Badge key={user.id} variant="secondary" className="pl-1 pr-0 py-0 flex items-center gap-1 group">
                          <span className="max-w-[120px] truncate">{user.name}</span>
                          <button
                            type="button"
                            onClick={() => removeUser(user.id)}
                            className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>

                  <div className="space-y-2">
                    <Command 
                      shouldFilter={false} 
                      className="rounded-xl border border-gray-200/50 dark:border-gray-700/50"
                    >
                      <CommandInput
                        placeholder="Procurar usuários por nome, email ou ID..."
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                      />
                      <CommandList className="max-h-[200px]">
                        {isSearching && (
                          <div className="p-4 text-center text-xs text-muted-foreground italic">
                            Buscando usuários...
                          </div>
                        )}

                        {!isSearching && searchTerm.length >= 2 && searchResults.length === 0 && (
                          <CommandEmpty className="p-0">
                            <EmptyResults
                              searchQuery={searchTerm}
                              title="Nenhum usuário encontrado"
                              className="py-4"
                            />
                          </CommandEmpty>
                        )}

                        <CommandGroup>
                          {searchResults.map((user) => {
                            const isSelected = selectedUsers.find(u => u.id === user.id);
                            return (
                              <CommandItem
                                key={user.id}
                                onSelect={() => toggleUser(user)}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                                  isSelected && "bg-primary/5"
                                )}
                              >
                                <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <UserIcon className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium truncate">{user.name}</span>
                                  <span className="text-[10px] text-muted-foreground truncate">{user.email}</span>
                                </div>
                                {isSelected ? (
                                  <Check className="w-4 h-4 text-primary" />
                                ) : (
                                  <Badge variant="outline" className="text-[8px] h-4">Selecionar</Badge>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>
              </VaultField>
            )}

            <div className="flex gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Controller
                  name="channels.inApp"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="inApp"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="inApp" className="text-sm cursor-pointer">In-App</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Controller
                  name="channels.push"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="push"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="push" className="text-sm cursor-pointer">Push Notification</Label>
              </div>
            </div>
          </VaultForm>
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>
            Cancelar
          </VaultSecondaryButton>
          <VaultPrimaryButton
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar Agora"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
