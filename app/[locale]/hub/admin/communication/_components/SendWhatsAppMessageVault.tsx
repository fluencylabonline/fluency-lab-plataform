"use client";

import { useState, useEffect, useMemo } from "react";
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
  VaultInput,
} from "@/components/ui/vault";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchUsersAction } from "@/modules/user/user.actions";
import { sendWhatsAppTemplateAction } from "@/modules/communication/communication.actions";
import { WhatsAppTemplate, WhatsAppTemplateComponent } from "@/modules/communication/communication.types";
import { User } from "@/modules/user/user.schema";
import { notify } from "@/components/ui/toaster";
import { Command, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { User as UserIcon, AlertCircle, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SendWhatsAppMessageVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: WhatsAppTemplate[];
}

interface TemplateParam {
  type: "body" | "button";
  index: number;
  value: string;
  buttonIndex?: number;
}

export function SendWhatsAppMessageVault({ open, onOpenChange, templates }: SendWhatsAppMessageVaultProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>("");
  const [params, setParams] = useState<TemplateParam[]>([]);

  const selectedTemplate = useMemo(() => 
    templates.find(t => t.name === selectedTemplateName),
    [templates, selectedTemplateName]
  );

  useEffect(() => {
    if (selectedTemplate) {
      const newParams: TemplateParam[] = [];
      
      // 1. Detect Body Params
      const body = selectedTemplate.components.find(c => c.type === "BODY");
      const bodyMatches = body?.text?.match(/{{(\d+)}}/g);
      if (bodyMatches) {
        bodyMatches.forEach((_, idx) => {
          newParams.push({
            type: "body",
            index: idx,
            value: idx === 0 && selectedUser ? selectedUser.name : ""
          });
        });
      }

      // 2. Detect Button Params (URL buttons)
      const buttons = selectedTemplate.components.find(c => c.type === "BUTTONS");
      if (buttons?.buttons) {
        (buttons.buttons as Array<{ type: string; url?: string }>).forEach((btn, btnIdx) => {
          if (btn.type === "URL" && btn.url?.includes("{{1}}")) {
             newParams.push({
               type: "button",
               index: 0,
               buttonIndex: btnIdx,
               value: ""
             });
          }
        });
      }
      
      setParams(newParams);
    } else {
      setParams([]);
    }
  }, [selectedTemplate, selectedUser]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const result = await searchUsersAction({ term: searchTerm });
        if (result?.data?.success && Array.isArray(result.data.data)) {
          setSearchResults(result.data.data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleParamChange = (type: "body" | "button", index: number, value: string, buttonIndex?: number) => {
    setParams(prev => prev.map(p => {
      if (p.type === type && p.index === index && p.buttonIndex === buttonIndex) {
        return { ...p, value };
      }
      return p;
    }));
  };

  const handleSend = async () => {
    if (!selectedUser || !selectedTemplate) {
      notify.error("Selecione um aluno e um template");
      return;
    }

    if (params.some(p => !p.value.trim())) {
      notify.error("Preencha todos os parâmetros");
      return;
    }

    // Check 30 char limit for BODY params
    if (params.some(p => p.type === "body" && p.value.length > 30)) {
      notify.error("Parâmetros do corpo não podem exceder 30 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const components: WhatsAppTemplateComponent[] = [];
      
      // Group body params
      const bodyParams = params.filter(p => p.type === "body");
      if (bodyParams.length > 0) {
        components.push({
          type: "body",
          parameters: bodyParams.map(p => ({ type: "text", text: p.value }))
        });
      }

      // Add button params
      const buttonParams = params.filter(p => p.type === "button");
      buttonParams.forEach(p => {
        components.push({
          type: "button",
          sub_type: "url",
          index: p.buttonIndex?.toString() || "0",
          parameters: [{ type: "text", text: p.value }]
        });
      });

      const result = await sendWhatsAppTemplateAction({
        to: selectedUser.cellphone!,
        templateName: selectedTemplate.name,
        languageCode: selectedTemplate.language,
        components: components.length > 0 ? components : undefined
      });

      if (result?.data) {
        notify.success("Mensagem enviada com sucesso!");
        onOpenChange(false);
        setSelectedUser(null);
        setSelectedTemplateName("");
      } else {
        notify.error("Erro ao enviar via Meta API");
      }
    } catch {
      notify.error("Erro técnico");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent>
        <VaultHeader>
          <VaultTitle>Iniciar Conversa</VaultTitle>
          <VaultDescription>Envie um template oficial com variáveis e botões.</VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-6">
          {/* Aluno */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">1. Selecione o Aluno</Label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.cellphone}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-xs text-muted-foreground underline">Trocar</button>
              </div>
            ) : (
              <Command shouldFilter={false} className="rounded-md border">
                <CommandInput placeholder="Buscar aluno..." value={searchTerm} onValueChange={setSearchTerm} />
                <CommandList className="max-h-[150px]">
                  {isSearching && <div className="p-4 text-center text-xs italic">Buscando...</div>}
                  <CommandGroup>
                    {searchResults.map(user => (
                      <CommandItem key={user.id} onSelect={() => setSelectedUser(user)} className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-[10px] text-muted-foreground">{user.email}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">2. Escolha o Template</Label>
            <Select value={selectedTemplateName} onValueChange={setSelectedTemplateName}>
              <SelectTrigger className="rounded-md h-11">
                <SelectValue placeholder="Selecione um template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.filter(t => t.status === "APPROVED").map(t => (
                  <SelectItem key={t.id} value={t.name}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-xs">{t.name}</span>
                      <span className="text-[10px] opacity-70">{t.language}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Parâmetros */}
          {selectedTemplate && params.length > 0 && (
            <div className="space-y-4 p-4 rounded-md bg-muted/30 border border-dashed">
              <div className="flex items-center gap-2 text-primary">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase">Variáveis</span>
              </div>
              <div className="grid gap-4">
                {params.map((p, idx) => {
                  const isTooLong = p.type === "body" && p.value.length > 30;
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-end">
                        <Label className="text-[10px] text-muted-foreground font-bold uppercase">
                          {p.type === "body" ? `Corpo {{${p.index + 1}}}` : `Botão (URL)`}
                        </Label>
                        {p.type === "body" && (
                          <span className={cn("text-[9px]", isTooLong ? "text-destructive font-bold" : "text-muted-foreground")}>
                            {p.value.length}/30
                          </span>
                        )}
                      </div>
                      <VaultInput 
                        value={p.value}
                        onChange={(e) => handleParamChange(p.type, p.index, e.target.value, p.buttonIndex)}
                        placeholder={p.type === "button" ? "Sufixo da URL (ex: welcome-link)" : "Valor..."}
                        className={cn("h-9 text-sm", isTooLong && "border-destructive! focus-visible:ring-destructive!")}
                      />
                      {isTooLong && <p className="text-[9px] text-destructive italic">Limite de 30 caracteres excedido!</p>}
                    </div>
                  );
                })}
              </div>
              {params.some(p => p.type === "button") && (
                <div className="flex items-start gap-2 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                  <Info className="w-3 h-3 text-blue-500 mt-0.5" />
                  <p className="text-[10px] text-blue-600 leading-tight">
                    <strong>Nota sobre Botão:</strong> Digite apenas a parte final (sufixo) da URL, conforme configurado na Meta.
                  </p>
                </div>
              )}
            </div>
          )}
        </VaultBody>

        <VaultFooter>
          <VaultSecondaryButton onClick={() => onOpenChange(false)}>Cancelar</VaultSecondaryButton>
          <VaultPrimaryButton 
            onClick={handleSend} 
            disabled={isLoading || !selectedUser || !selectedTemplate || params.some(p => p.value.length > 30 && p.type === "body")}
          >
            {isLoading ? "Enviando..." : "Iniciar Chat"}
          </VaultPrimaryButton>
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
