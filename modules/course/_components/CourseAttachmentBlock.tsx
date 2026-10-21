"use client";

import { Download, FileArchive, FileAudio, FileImage, FileText, Paperclip } from "lucide-react";
import { useTranslations } from "next-intl";

interface CourseAttachmentBlockProps {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  const className = "h-5 w-5";
  if (mimeType.startsWith("image/")) return <FileImage className={className} />;
  if (mimeType.startsWith("audio/")) return <FileAudio className={className} />;
  if (mimeType.includes("zip")) return <FileArchive className={className} />;
  if (mimeType === "application/pdf" || mimeType.startsWith("text/") || mimeType.includes("word")) return <FileText className={className} />;
  return <Paperclip className={className} />;
}

/** Cartão de um anexo da aula, com download. Usado no player e na pré-visualização do editor. */
export function CourseAttachmentBlock({ url, name, size, mimeType }: CourseAttachmentBlockProps) {
  const t = useTranslations("Courses");

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      download={name}
      className="card group flex items-center gap-4 p-4 no-underline"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <AttachmentIcon mimeType={mimeType} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{name}</span>
        <span className="block text-xs text-muted-foreground">
          {t("attachmentLabel")}
          {size ? ` · ${formatFileSize(size)}` : ""}
        </span>
      </span>
      <Download className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
    </a>
  );
}
