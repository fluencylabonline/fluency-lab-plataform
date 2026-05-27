"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Search, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { notify } from "@/components/ui/toaster";

export function CertificateSearchForm() {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim() || code.length < 4) {
      notify.error("Código inválido", "Por favor, insira um código de certificado válido.");
      return;
    }

    setIsLoading(true);
    router.push(`/certificate/${code.trim().toUpperCase()}`);
  };

  return (
    <div className="bg-slate-300/50 dark:bg-gray-900 rounded-md p-8 bg-card border-border max-w-md mx-auto">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Validar Certificado</h2>
        <p className="text-muted-foreground mt-2">
          Insira o código de autenticidade para verificar as informações do certificado.
        </p>
      </div>

      <form onSubmit={handleVerify} className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ex: FL-ABC123"
            className="pl-10 h-12 text-lg uppercase"
            disabled={isLoading}
            autoFocus
          />
        </div>
        
        <Button type="submit" size="lg" className="h-12 font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verificar Agora"}
        </Button>
        
        <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50">
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            O código de autenticidade é uma sequência única de caracteres que garante que este documento foi emitido oficialmente pela <strong>Fluency Lab</strong>.
          </p>
        </div>
      </form>
    </div>
  );
}
