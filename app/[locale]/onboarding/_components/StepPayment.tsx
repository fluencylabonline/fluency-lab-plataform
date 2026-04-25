"use client";

import { useTranslations } from "next-intl";
import { onboardingPaymentAction } from "@/modules/user/onboarding.actions";
import { getPlansAction, getInstallmentStatusAction, getActivePaymentAction } from "@/modules/billing/billing.actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Info, CheckCircle2, Copy, QrCode, Calendar, ArrowRight } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/user/user.schema";
import type { Plan } from "@/modules/billing/billing.schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

export function StepPayment({ onNext, onBack, user }: { onNext: (data: any) => void; onBack: () => void; user: User }) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [selectedDueDay, setSelectedDueDay] = useState<string>(user.dueDay?.toString() || "10");
    const [pixData, setPixData] = useState<{
        pixPayload: string | null;
        pixImage: string | null;
        expiresAt: Date;
        installmentId: string;
        status: string;
    } | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            // 1. Fetch Plan
            if (user.assignedPlanId) {
                const plansResult = await getPlansAction();
                if (plansResult?.data?.success && plansResult.data.data) {
                    const found = plansResult.data.data.find((p: Plan) => p.id === user.assignedPlanId);
                    setPlan(found || null);
                }
            }

            // 2. Check for existing payment
            const paymentResult = await getActivePaymentAction();
            if (paymentResult?.data?.success && paymentResult.data.data) {
                const payment = paymentResult.data.data;
                // Only auto-load if it's the first installment (onboarding charge)
                if (payment.orderIndex === 1) {
                    setPixData({
                        pixPayload: payment.pixPayload,
                        pixImage: payment.pixImage,
                        expiresAt: new Date(payment.dueDate),
                        installmentId: payment.installmentId,
                        status: payment.status
                    });

                    if (user.dueDay) {
                        setSelectedDueDay(user.dueDay.toString());
                    }
                }
            }

            setPlansLoading(false);
        };
        fetchInitialData();
    }, [user.assignedPlanId, user.dueDay]);

    // Polling for payment status
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (pixData && pixData.status !== "paid") {
            interval = setInterval(async () => {
                const result = await getInstallmentStatusAction({ installmentId: pixData.installmentId });
                if (result?.data?.success && result.data.data?.status === "paid") {
                    setPixData(prev => prev ? { ...prev, status: "paid" } : null);
                    notify.success(t("payment.successTitle") || "Pagamento confirmado!");
                    clearInterval(interval);
                }
            }, 3000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [pixData, t]);

    const calculateProRata = (dueDay: number, price: number) => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        if (dueDay > today.getDate()) {
            return { amount: price, isProRata: false };
        } else {
            const daysRemaining = totalDaysInMonth - today.getDate() + 1;
            const proRataAmount = Math.round((price / totalDaysInMonth) * daysRemaining);
            return { amount: proRataAmount, isProRata: true };
        }
    };

    const handleConfirmDate = async () => {
        setLoading(true);
        const result = await onboardingPaymentAction({ dueDay: parseInt(selectedDueDay) });
        setLoading(false);

        if (result?.data?.success && result.data.data) {
            setPixData(result.data.data);
            notify.success(t("payment.invoiceGenerated") || "Cobran\u00e7a gerada com sucesso!");
        } else {
            notify.error((result?.data as any)?.error || "Error");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notify.success(t("payment.copied") || "C\u00f3digo copiado!");
    };

    if (plansLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    const { amount, isProRata } = plan ? calculateProRata(parseInt(selectedDueDay), plan.price) : { amount: 0, isProRata: false };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("payment.title")}</h2>
                <p className="text-muted-foreground">{t("payment.subtitle")}</p>
            </div>

            {/* Plan Summary */}
            {!pixData && plan && (
                <div className="bg-muted/50 rounded-xl p-6 space-y-4 border border-border/50">
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-lg">{plan.name}</span>
                        <Badge variant="secondary">{plan.classesPerWeek} aulas/semana</Badge>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{t("payment.totalValue")}</span>
                            <span>R$ {(plan.price / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg">
                            <span>{t("payment.firstPayment")}</span>
                            <span className="text-primary">R$ {(amount / 100).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Selection */}
            {!pixData && (
                <div className="space-y-4">
                    <Label>{t("payment.dueDay")}</Label>
                    <RadioGroup
                        value={selectedDueDay}
                        onValueChange={setSelectedDueDay}
                        className="grid grid-cols-4 gap-4"
                    >
                        {["1", "5", "10", "15"].map((day) => {
                            const isSelected = selectedDueDay === day;
                            return (
                                <Label
                                    key={day}
                                    htmlFor={`day-${day}`}
                                    className={cn(
                                        "flex flex-col items-center justify-center rounded-xl border-2 p-4 cursor-pointer transition-all h-16",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                                            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                                    )}
                                >
                                    <RadioGroupItem value={day} id={`day-${day}`} className="sr-only" />
                                    <span className="text-xl font-bold">{day}</span>
                                </Label>
                            );
                        })}
                    </RadioGroup>
                </div>
            )}

            {/* Pro-rata Warning */}
            {!pixData && isProRata && (
                <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-700 dark:text-blue-400/80">
                        {t("payment.prorataWarning")}
                    </AlertDescription>
                </Alert>
            )}

            {/* PIX Display */}
            {pixData && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {pixData.status === "paid" ? (
                        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-2xl p-8 text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="bg-green-100 dark:bg-green-900/40 p-3 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-green-900 dark:text-green-100">{t("payment.paidTitle") || "Pagamento Recebido!"}</h3>
                            <p className="text-green-700 dark:text-green-400/80">{t("payment.paidSubtitle") || "Sua primeira mensalidade foi confirmada. Agora voc\u00ea pode prosseguir para o contrato."}</p>
                        </div>
                    ) : (
                        <div className="bg-card border rounded-2xl overflow-hidden">
                            <div className="bg-primary/5 p-4 border-b flex items-center gap-3">
                                <QrCode className="h-5 w-5 text-primary" />
                                <span className="font-semibold">{t("payment.payNowTitle") || "Pagar com PIX"}</span>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="bg-white p-4 rounded-xl border-4 border-white shadow-xl">
                                        <Image src={pixData.pixImage || ""} alt="PIX QR Code" width={192} height={192} />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-muted-foreground">{t("payment.expiresAt") || "Vencimento em"}</p>
                                        <div className="flex items-center justify-center gap-2 font-mono font-bold">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(pixData.expiresAt), "dd/MM/yyyy", { locale: ptBR })}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{t("payment.copyPaste") || "C\u00f3digo Copia e Cola"}</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-muted p-3 rounded-lg text-xs font-mono break-all line-clamp-1 border">
                                            {pixData.pixPayload}
                                        </div>
                                        <Button size="icon" variant="secondary" onClick={() => copyToClipboard(pixData.pixPayload || "")}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
                                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertDescription className="text-amber-700 dark:text-amber-400/80 text-sm">
                                        {t("payment.payLaterWarning") || "Voc\u00ea pode pagar agora ou depois. O acesso ser\u00e1 liberado assim que o sistema identificar o pagamento."}
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 pt-4">
                {!pixData ? (
                    <>
                        <Button type="button" variant="outline" className="flex-1 h-12" onClick={onBack} disabled={loading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> {t("steps.back") || "Voltar"}
                        </Button>
                        <Button onClick={handleConfirmDate} className="flex-[2] h-12" disabled={loading || !plan}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("payment.confirmDate") || "Confirmar data"}
                        </Button>
                    </>
                ) : (
                    <Button
                        onClick={() => onNext({ dueDay: parseInt(selectedDueDay) })}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    >
                        {t("steps.next") || "Pr\u00f3ximo"} <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
