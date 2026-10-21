"use client";

import { useState } from "react";
import { Download, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import {
  emailRecessActivityPdfAction,
  getRecessActivityPdfAction,
} from "@/modules/scheduling/scheduling.actions";

type Busy = "download" | "email" | null;

function base64ToBlob(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

export function RecessActivityPdfActions({ slotId }: { slotId: string }) {
  const t = useTranslations("StudentRecess.pdf");
  const [busy, setBusy] = useState<Busy>(null);

  const fetchPdf = async () => {
    const result = await getRecessActivityPdfAction({ slotId });
    const data = result?.data;
    if (!data?.success || !("base64" in data) || !data.base64) {
      notify.error((data && "error" in data && data.error) || t("error"));
      return null;
    }
    return { blob: base64ToBlob(data.base64), filename: data.filename };
  };

  const handleDownload = async () => {
    setBusy("download");
    const pdf = await fetchPdf();
    setBusy(null);
    if (!pdf) return;
    const url = URL.createObjectURL(pdf.blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = pdf.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleEmail = async () => {
    setBusy("email");
    const result = await emailRecessActivityPdfAction({ slotId });
    setBusy(null);
    const data = result?.data;
    if (data?.success && "email" in data && data.email) {
      notify.success(t("emailSent", { email: data.email }));
    } else {
      notify.error((data && "error" in data && data.error) || t("emailError"));
    }
  };

  const actions = [
    { key: "download" as const, label: t("download"), icon: Download, onClick: handleDownload },
    { key: "email" as const, label: t("email"), icon: Mail, onClick: handleEmail },
  ];

  return (
    <div className="grid grid-cols-2 gap-2" data-tour="student-recess.pdf">
      {actions.map(({ key, label, icon: Icon, onClick }) => (
        <Button
          key={key}
          type="button"
          variant="outline"
          size="sm"
          onClick={onClick}
          disabled={busy !== null}
          className="h-9 w-full gap-2 text-xs"
        >
          {busy === key ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <Icon className="h-3.5 w-3.5" />
          )}
          {label}
        </Button>
      ))}
    </div>
  );
}
