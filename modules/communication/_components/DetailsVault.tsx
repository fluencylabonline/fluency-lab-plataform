"use client";

import { useState, useEffect } from "react";
import { WhatsAppConversation, WhatsAppLabel } from "../communication.types";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody
} from "@/components/ui/vault";
import {
  updateWhatsAppContactNameAction,
  updateWhatsAppConversationLabelsAction,
  archiveWhatsAppConversationAction,
  associateWhatsAppStudentAction
} from "@/modules/communication/communication.actions";
import { searchStudentsAction } from "@/modules/user/user.actions";
import { notify } from "@/components/ui/toaster";
import { Loader2, Copy, Tag, Plus, X, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";

const LABEL_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  blue: { bg: "bg-blue-500/10 dark:bg-blue-500/15", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", hex: "#0070f3" },
  orange: { bg: "bg-orange-500/10 dark:bg-orange-500/15", text: "text-orange-600 dark:text-orange-400", border: "border-orange-500/20", hex: "#f5a623" },
  green: { bg: "bg-emerald-500/10 dark:bg-emerald-500/15", text: "text-[#00a884] dark:text-emerald-400", border: "border-emerald-500/20", hex: "#00a884" },
  red: { bg: "bg-red-500/10 dark:bg-red-500/15", text: "text-red-600 dark:text-red-400", border: "border-red-500/20", hex: "#ff0055" },
  purple: { bg: "bg-purple-500/10 dark:bg-purple-500/15", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500/20", hex: "#7928ca" },
  yellow: { bg: "bg-yellow-500/10 dark:bg-yellow-500/15", text: "text-yellow-600 dark:text-yellow-400", border: "border-yellow-500/20", hex: "#e3b300" },
};

const DEFAULT_LABELS: WhatsAppLabel[] = [
  { id: "1", name: "Novo Aluno", color: "blue" },
  { id: "2", name: "Aguardando", color: "orange" },
  { id: "3", name: "Pago", color: "green" },
  { id: "4", name: "Importante", color: "red" },
  { id: "5", name: "Lead Frio", color: "purple" },
];

interface DetailsVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConv: WhatsAppConversation;
  setSelectedConv: (conv: WhatsAppConversation) => void;
  mutateConvs: () => void;
  availableLabels: WhatsAppLabel[];
  setAvailableLabels: (labels: WhatsAppLabel[]) => void;
  currentDisplayName: string;
}

export function DetailsVault({
  open,
  onOpenChange,
  selectedConv,
  setSelectedConv,
  mutateConvs,
  availableLabels,
  setAvailableLabels,
  currentDisplayName,
}: DetailsVaultProps) {
  const [contactNameInput, setContactNameInput] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("blue");
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  // Student association state
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  const handleSearchStudents = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingStudents(true);
    try {
      const res = await searchStudentsAction({ term: query });
      if (res?.data?.success && res.data.data) {
        setSearchResults(res.data.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingStudents(false);
    }
  };

  // Sync details input when contact is switched or loaded
  useEffect(() => {
    setContactNameInput(selectedConv.contactName || "");
  }, [selectedConv]);

  // Save Contact Name details
  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingName(true);
    try {
      const result = await updateWhatsAppContactNameAction({
        conversationId: selectedConv.id,
        name: contactNameInput.trim(),
      });

      if (result?.data?.success) {
        // Sync local selected conversation state
        const updated = { ...selectedConv, contactName: contactNameInput.trim() };
        setSelectedConv(updated);
        mutateConvs(); // Refresh sidebar list instantly!
        notify.success("Nome atualizado com sucesso!");
      } else {
        notify.error("Erro ao atualizar o nome.");
      }
    } catch {
      notify.error("Erro técnico ao atualizar nome.");
    } finally {
      setIsSavingName(false);
    }
  };

  // Toggle checklist label
  const handleToggleLabel = async (lbl: WhatsAppLabel, isChecked: boolean) => {
    const currentLabels = selectedConv.labels || [];
    let updatedLabels: WhatsAppLabel[] = [];

    if (isChecked) {
      if (!currentLabels.some((l) => l.id === lbl.id)) {
        updatedLabels = [...currentLabels, lbl];
      } else {
        updatedLabels = currentLabels;
      }
    } else {
      updatedLabels = currentLabels.filter((l) => l.id !== lbl.id);
    }

    try {
      const result = await updateWhatsAppConversationLabelsAction({
        conversationId: selectedConv.id,
        labels: updatedLabels,
      });

      if (result?.data?.success) {
        const updatedConv = { ...selectedConv, labels: updatedLabels };
        setSelectedConv(updatedConv);
        mutateConvs(); // Refresh sidebar lists immediately!
        notify.success(isChecked ? "Etiqueta vinculada!" : "Etiqueta removida!");
      } else {
        notify.error("Erro ao atualizar etiquetas.");
      }
    } catch {
      notify.error("Erro técnico ao atualizar etiquetas.");
    }
  };

  // Create custom label
  const handleCreateLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelName.trim()) return;

    const newLabel: WhatsAppLabel = {
      id: Math.random().toString(),
      name: newLabelName.trim(),
      color: newLabelColor,
    };

    setAvailableLabels([...availableLabels, newLabel]);
    setNewLabelName("");
    setNewLabelColor("blue");
    setIsCreatingLabel(false);
    notify.success("Etiqueta criada!");
  };

  const handleArchive = async () => {
    try {
      const isArchived = !selectedConv.isArchived;
      const result = await archiveWhatsAppConversationAction({
        conversationId: selectedConv.id,
        isArchived,
      });

      if (result?.data?.success) {
        notify.success(isArchived ? "Conversa arquivada" : "Conversa desarquivada");
        onOpenChange(false);
        setSelectedConv(null as unknown as WhatsAppConversation);
        mutateConvs();
      } else {
        notify.error("Erro ao arquivar conversa");
      }
    } catch {
      notify.error("Erro técnico");
    }
  };

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-md">
        <VaultHeader>
          <VaultTitle>Dados do Contato</VaultTitle>
          <VaultDescription>Visualize e gerencie as etiquetas e o nome do contato</VaultDescription>
        </VaultHeader>
        <VaultBody className="space-y-5 pt-3">
          
          {/* Contact Profile circle */}
          <div className="flex flex-col items-center text-center pb-6 border-b border-border/40">
            <Avatar seed={selectedConv.waId} photoUrl={selectedConv.photoUrl} name={currentDisplayName} size={80} />
            <h3 className="font-bold text-lg mt-3 text-foreground select-all leading-tight">
              {currentDisplayName}
            </h3>
            {selectedConv.studentName && selectedConv.contactName && (
              <p className="text-xs text-muted-foreground mt-0.5 select-all">
                Apelido: {selectedConv.contactName}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 bg-muted/40 px-3 py-1 rounded-full border border-border/10 select-all">
              <span className="text-xs font-semibold text-foreground/80">+{selectedConv.waId}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  navigator.clipboard.writeText(`+${selectedConv.waId}`);
                  notify.success("Número copiado!");
                }}
                className="w-5 h-5 rounded-full hover:bg-muted"
                title="Copiar telefone para área de transferência"
              >
                <Copy className="w-3 h-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Nome Customizado Form */}
          <div className="space-y-2 pb-4 border-b border-border/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome do Contato</h4>
            <form onSubmit={handleSaveName} className="flex gap-2 items-center">
              <Input
                value={contactNameInput}
                onChange={(e) => setContactNameInput(e.target.value)}
                placeholder="Adicionar nome customizado..."
                className="h-9 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
              />
              <Button 
                type="submit" 
                size="sm" 
                disabled={isSavingName}
                className="h-9 text-xs font-semibold rounded-xl bg-primary px-4 shrink-0 transition-transform active:scale-95 disabled:opacity-40"
              >
                {isSavingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar"}
              </Button>
            </form>
          </div>

          {/* Associação de Estudante */}
          <div className="space-y-2 pb-4 border-b border-border/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estudante Vinculado</h4>
            
            {selectedConv.studentId ? (
              <div className="flex items-center justify-between bg-muted/20 border border-border/10 p-2.5 rounded-xl gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar seed={selectedConv.studentId} photoUrl={selectedConv.photoUrl} name={selectedConv.studentName} size={36} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{selectedConv.studentName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">ID: {selectedConv.studentId.substring(0, 8)}...</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setIsLinking(true);
                    try {
                      const res = await associateWhatsAppStudentAction({
                        conversationId: selectedConv.id,
                        studentId: null
                      });
                      if (res?.data?.success) {
                        setSelectedConv({
                          ...selectedConv,
                          studentId: null,
                          studentName: null,
                          photoUrl: null
                        });
                        mutateConvs();
                        notify.success("Estudante desvinculado!");
                      } else {
                        notify.error("Erro ao desvincular estudante.");
                      }
                    } catch {
                      notify.error("Erro técnico ao desvincular.");
                    } finally {
                      setIsLinking(false);
                    }
                  }}
                  disabled={isLinking}
                  className="h-7 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2.5 rounded-lg font-semibold shrink-0"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    value={studentSearchQuery}
                    onChange={(e) => {
                      setStudentSearchQuery(e.target.value);
                      handleSearchStudents(e.target.value);
                    }}
                    placeholder="Buscar estudante por nome..."
                    className="h-9 text-xs rounded-xl focus-visible:ring-primary/20 bg-muted/20 border-border/30"
                  />
                  {isSearchingStudents && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {searchResults.length > 0 && (
                  <div className="border border-border/20 bg-card rounded-xl max-h-36 overflow-y-auto divide-y divide-border/10 shadow-lg select-none">
                    {searchResults.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={async () => {
                          setIsLinking(true);
                          try {
                            const res = await associateWhatsAppStudentAction({
                              conversationId: selectedConv.id,
                              studentId: student.id
                            });
                            if (res?.data?.success) {
                              setSelectedConv({
                                ...selectedConv,
                                studentId: student.id,
                                studentName: student.name,
                                photoUrl: student.photoUrl
                              });
                              mutateConvs();
                              setStudentSearchQuery("");
                              setSearchResults([]);
                              notify.success("Estudante vinculado!");
                            } else {
                              notify.error("Erro ao vincular estudante.");
                            }
                          } catch {
                            notify.error("Erro técnico.");
                          } finally {
                            setIsLinking(false);
                          }
                        }}
                        disabled={isLinking}
                        className="w-full flex items-center gap-2 p-2 text-left hover:bg-muted/50 transition-colors"
                      >
                        <Avatar seed={student.id} photoUrl={student.photoUrl} name={student.name} size={28} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{student.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Labels List & custom label creation */}
          <div className="space-y-4 pt-1">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Etiquetas da Conversa
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCreatingLabel(!isCreatingLabel)}
                className="h-7 text-[11px] font-semibold text-primary px-2 rounded-lg flex items-center gap-1"
              >
                {isCreatingLabel ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {isCreatingLabel ? "Cancelar" : "Nova"}
              </Button>
            </div>

            {/* Nova Etiqueta Form */}
            {isCreatingLabel && (
              <form onSubmit={handleCreateLabel} className="bg-muted/30 border border-border/20 rounded-xl p-3.5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome da Etiqueta</label>
                  <Input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Ex: Novo Cliente, Pendente..."
                    className="h-8 text-xs bg-background border-border/30 rounded-lg"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground block">Cor de Destaque</label>
                  <div className="flex gap-2">
                    {Object.keys(LABEL_COLORS).map((colorKey) => {
                      const isSelected = newLabelColor === colorKey;
                      const colors = LABEL_COLORS[colorKey];
                      return (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={() => setNewLabelColor(colorKey)}
                          className={cn(
                            "w-6 h-6 rounded-full border border-border/10 transition-transform active:scale-95 shrink-0",
                            isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-black scale-105"
                          )}
                          style={{ backgroundColor: colors.hex }}
                          title={colorKey}
                        />
                      );
                    })}
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={!newLabelName.trim()} 
                  className="w-full h-8 text-xs font-semibold rounded-lg bg-primary"
                >
                  Criar Etiqueta
                </Button>
              </form>
            )}

            {/* Lista de Etiquetas */}
            <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
              {availableLabels.map((lbl) => {
                const isChecked = selectedConv.labels?.some((l) => l.id === lbl.id) ?? false;
                const colors = LABEL_COLORS[lbl.color] || LABEL_COLORS.blue;
                return (
                  <label
                    key={lbl.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border/20 hover:bg-muted/20 cursor-pointer select-none transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleLabel(lbl, e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-border/40 shrink-0"
                      />
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-md border",
                        colors.bg,
                        colors.text,
                        colors.border
                      )}>
                        {lbl.name}
                      </span>
                    </div>
                    
                    {/* Delete custom label button if not default */}
                    {!DEFAULT_LABELS.some(d => d.id === lbl.id) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const updatedAvailable = availableLabels.filter(a => a.id !== lbl.id);
                          setAvailableLabels(updatedAvailable);
                          if (isChecked) {
                            handleToggleLabel(lbl, false);
                          }
                          notify.success("Etiqueta removida do sistema!");
                        }}
                        className="p-1 rounded-full hover:bg-muted text-muted-foreground shrink-0 transition-colors"
                        title="Excluir etiqueta do sistema"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 pb-2 border-t border-border/40">
            <Button
              variant="outline"
              className="w-full h-10 text-[13px] font-semibold border-border/40 hover:bg-muted transition-colors flex items-center justify-center gap-2"
              onClick={handleArchive}
            >
              {selectedConv.isArchived ? (
                <>
                  <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                  Desarquivar Conversa
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-muted-foreground" />
                  Arquivar Conversa
                </>
              )}
            </Button>
          </div>

        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
