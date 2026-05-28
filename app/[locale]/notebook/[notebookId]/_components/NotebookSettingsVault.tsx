"use client";

import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { useLanguages } from "@/hooks/data/use-languages";
import {
  Vault,
  VaultContent,
  VaultHeader,
  VaultTitle,
  VaultDescription,
  VaultBody,
} from "@/components/ui/vault";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotebookSettingsVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotebookSettingsVault({ open, onOpenChange }: NotebookSettingsVaultProps) {
  const { languages, isLoading: isLoadingLanguages } = useLanguages();
  
  const [readerLanguage, setReaderLanguage] = useState<string>("");
  const [readerSpeed, setReaderSpeed] = useState<number>(1);

  // Carrega as configurações do localStorage de forma assíncrona para evitar renderização em cascata
  useEffect(() => {
    if (typeof window !== "undefined") {
      const handle = setTimeout(() => {
        setReaderLanguage(localStorage.getItem("reader_language") || "");
        
        const savedSpeed = localStorage.getItem("reader_speed");
        if (savedSpeed) {
          setReaderSpeed(parseFloat(savedSpeed) || 1);
        }
      }, 0);
      
      return () => clearTimeout(handle);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setReaderLanguage(lang);
    if (typeof window !== "undefined") {
      if (lang) {
        localStorage.setItem("reader_language", lang);
      } else {
        localStorage.removeItem("reader_language");
      }
    }
  };

  const handleSpeedChange = (speed: number) => {
    setReaderSpeed(speed);
    if (typeof window !== "undefined") {
      localStorage.setItem("reader_speed", speed.toString());
    }
  };

  const speechSpeeds = [
    { label: "0.5x", value: 0.5 },
    { label: "0.75x", value: 0.75 },
    { label: "Normal (1x)", value: 1 },
    { label: "1.25x", value: 1.25 },
    { label: "1.5x", value: 1.5 },
    { label: "2x", value: 2 },
  ];

  return (
    <Vault open={open} onOpenChange={onOpenChange}>
      <VaultContent className="sm:max-w-md">
        <VaultHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <VaultTitle className="text-left font-bold">Configurações de Leitura</VaultTitle>
          </div>
          <VaultDescription className="text-left">
            Personalize o comportamento de leitura de texto e tradução de palavras do seu notebook.
          </VaultDescription>
        </VaultHeader>
        <VaultBody className="p-6 space-y-5">
          {/* Seleção de Idioma */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Idioma de Leitura (TTS & Tradutor)
            </label>
            <Select
              value={readerLanguage || "auto"}
              onValueChange={(val) => handleLanguageChange(val === "auto" ? "" : val)}
              disabled={isLoadingLanguages}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Detecção Automática</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.code}>
                    {lang.name} ({lang.code.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-normal">
              Ao selecionar um idioma fixo, a leitura em voz alta e as buscas no dicionário priorizarão este idioma. A detecção automática usará a heurística inteligente do app.
            </p>
          </div>

          {/* Seleção de Velocidade */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-foreground">
              Velocidade de Leitura
            </label>
            <Select
              value={readerSpeed.toString()}
              onValueChange={(val) => handleSpeedChange(parseFloat(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a velocidade" />
              </SelectTrigger>
              <SelectContent>
                {speechSpeeds.map((s) => (
                  <SelectItem key={s.value} value={s.value.toString()}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground leading-normal">
              Ajuste a velocidade da sintetização de voz para escutar a pronúncia dos textos selecionados.
            </p>
          </div>
        </VaultBody>
      </VaultContent>
    </Vault>
  );
}
