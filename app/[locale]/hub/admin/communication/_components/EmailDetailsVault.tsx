"use client";

import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
  VaultFooter,
  VaultPrimaryButton
} from "@/components/ui/vault";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowDownLeft, ArrowUpRight } from "lucide-react";

import { EmailMessage } from "@/modules/communication/communication.types";

export type EmailMessageDetail = EmailMessage;


interface EmailDetailsVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: EmailMessageDetail | null;
  onReply?: (emailAddress: string, subject: string) => void;
}

export function EmailDetailsVault({ open, onOpenChange, email, onReply }: EmailDetailsVaultProps) {
  if (!email) return null;

  const dateStr = format(new Date(email.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
  
  const cleanFromEmail = email.from.includes("<")
    ? email.from.split("<")[1].split(">")[0].trim()
    : email.from.trim();

  const recipients = Array.isArray(email.to) ? email.to : [email.to];

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="max-w-3xl">
        <VaultHeader>
          <div className="flex items-center gap-2 mb-2">
            {email.direction === "inbound" ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                Recebido
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Enviado
              </Badge>
            )}
            <Badge variant="outline" className="uppercase text-[9px]">
              {email.status}
            </Badge>
          </div>
          <VaultTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
            <span className="line-clamp-2">{email.subject}</span>
          </VaultTitle>
          <VaultDescription className="text-xs">
            {dateStr}
          </VaultDescription>
        </VaultHeader>

        <VaultBody className="space-y-4">
          {/* Metadata details */}
          <div className="grid gap-2 text-xs bg-muted/40 p-3 rounded-lg border border-border/50">
            <div>
              <span className="font-semibold text-muted-foreground mr-1">De:</span>
              <span className="font-mono">{email.from}</span>
              {email.studentName && email.direction === "inbound" && (
                <span className="ml-2 text-primary font-medium">({email.studentName})</span>
              )}
            </div>
            <div>
              <span className="font-semibold text-muted-foreground mr-1">Para:</span>
              <span className="font-mono">{recipients.join(", ")}</span>
              {email.studentName && email.direction === "outbound" && (
                <span className="ml-2 text-primary font-medium">(Aluno: {email.studentName})</span>
              )}
            </div>
          </div>

          {/* Email Body encapsulated inside an Iframe for styling protection */}
          <div className="flex flex-col flex-1 min-h-[300px]">
            <iframe
              srcDoc={
                email.html ||
                `<!DOCTYPE html><html><head><style>body { font-family: sans-serif; line-height: 1.6; color: #333; margin: 20px; white-space: pre-wrap; }</style></head><body>${email.text || "(Sem conteúdo)"}</body></html>`
              }
              className="w-full flex-1 min-h-[350px] border border-border rounded-lg bg-white shadow-none"
              sandbox="allow-same-origin"
              title="Visualização do E-mail"
            />
          </div>
        </VaultBody>

        <VaultFooter>
          {email.direction === "inbound" && onReply && (
            <VaultPrimaryButton
              onClick={() => {
                onOpenChange(false);
                onReply(cleanFromEmail, email.subject);
              }}
            >
              Responder
            </VaultPrimaryButton>
          )}
        </VaultFooter>
      </VaultContent>
    </Vault>
  );
}
