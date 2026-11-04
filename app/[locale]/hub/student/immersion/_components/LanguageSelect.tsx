"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

type LanguageSelectProps = {
  value: string;
  options: string[];
  onChange: (lang: string) => void;
  disabled?: boolean;
  getLabel?: (code: string) => ReactNode;
};

const LANGUAGE_KEYS = {
  en: "english",
  pt: "portuguese",
  es: "spanish",
  de: "german",
  fr: "french",
  it: "italian",
} as const;

function defaultLanguageLabel(code: string, tLang: (key: (typeof LANGUAGE_KEYS)[keyof typeof LANGUAGE_KEYS]) => string) {
  const normalized = code.toLowerCase();
  const key = LANGUAGE_KEYS[normalized as keyof typeof LANGUAGE_KEYS];
  return key ? tLang(key) : normalized.toUpperCase();
}

export function LanguageSelect({
  value,
  options,
  onChange,
  disabled,
  getLabel,
}: LanguageSelectProps) {
  const tLang = useTranslations("Languages");
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
            {getLabel ? getLabel(code) : defaultLanguageLabel(code, tLang)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
