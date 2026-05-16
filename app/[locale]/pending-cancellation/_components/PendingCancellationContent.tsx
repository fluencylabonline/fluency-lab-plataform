"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { notify } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { getUserStatusAction } from "@/modules/user/user.actions";
import type { User } from "@/modules/user/user.schema";
import { Img } from "@react-email/components";

interface PendingCancellationContentProps {
  user: User;
}

export function PendingCancellationContent({ user }: PendingCancellationContentProps) {
  const t = useTranslations("PendingCancellation");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  // Polling to check if user is deactivated or cancellation is no longer pending
  const { data: status } = useSWR(
    "user-status",
    async () => {
      const res = await getUserStatusAction();
      return res?.data;
    },
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    // If user becomes inactive, it means cancellation was finalized
    if (status && status.isActive === false) {
      router.push("/suspended");
    }
    // If cancellation is no longer pending but user is active, return to hub
    if (status && status.isActive === true && status.cancellationPending === false) {
      router.push("/hub");
    }
  }, [status, router]);

  const copyToClipboard = () => {
    if (!user.cancellationPixCode) return;
    navigator.clipboard.writeText(user.cancellationPixCode);
    setCopied(true);
    notify.success(t("copied"));
    setTimeout(() => setCopied(false), 2000);
  };

  const amount = Number(user.cancellationAmount) / 100;

  return (
    <div className="flex-1 container max-w-2xl py-12 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>

      <h1 className="text-3xl font-bold mb-4 tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground mb-12 max-w-md">
        {t("description")}
      </p>

      <div className="card w-full p-8 space-y-8 border-2">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">{t("amountToPay")}</p>
          <p className="text-4xl font-black text-primary">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(amount)}
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="text-sm font-medium">{t("pixInstructions")}</p>
          <div className="p-4 bg-white rounded-2xl border-4 border-muted shadow-sm transition-transform hover:scale-[1.02]">
            {user.cancellationPixImage ? (
              <Img 
                src={user.cancellationPixImage} 
                alt="QR Code PIX" 
                className="w-64 h-64" 
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center bg-muted/50 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("pixCopyPaste")}</p>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted/50 p-3 rounded-md border text-left truncate font-mono text-[10px] leading-relaxed select-all">
              {user.cancellationPixCode}
            </div>
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={copyToClipboard} 
              className="shrink-0 h-10 w-10"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-primary/5 text-primary text-sm font-medium border border-primary/10">
           <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
           {t("waitingPayment")}
        </div>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          {t("helpInfo")}
        </p>
      </div>
    </div>
  );
}
