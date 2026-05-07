"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LanguageSelectProps = {
  value: string;
  options: string[];
  onChange: (lang: string) => void;
  disabled?: boolean;
  getLabel?: (code: string) => ReactNode;
};

function defaultLanguageLabel(code: string) {
  const normalized = code.toLowerCase();
  const map: Record<string, string> = {
    en: "Inglês",
    pt: "Português",
    es: "Espanhol",
    de: "Alemão",
    fr: "Francês",
    it: "Italiano",
  };
  return map[normalized] ?? normalized.toUpperCase();
}

export function LanguageSelect({
  value,
  options,
  onChange,
  disabled,
  getLabel,
}: LanguageSelectProps) {
  const safeValue = (value || "").toLowerCase();
  const safeOptions = (options.length ? options : safeValue ? [safeValue] : [])
    .map((x) => x.toLowerCase())
    .filter(Boolean);

  return (
    <Select
      value={safeValue}
      onValueChange={(v) => {
        const next = v.toLowerCase();
        if (next === safeValue) return;
        onChange(next);
      }}
    >
      <SelectTrigger
        size="sm"
        className="rounded-full bg-transparent border-border/60"
        disabled={disabled ?? safeOptions.length <= 1}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {safeOptions.map((code) => (
          <SelectItem key={code} value={code}>
            {getLabel ? getLabel(code) : defaultLanguageLabel(code)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
