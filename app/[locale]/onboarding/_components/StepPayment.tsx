"use client";

import { useTranslations } from "next-intl";
import { onboardingPaymentAction } from "@/modules/onboarding/onboarding.actions";
import { getPlansAction, getInstallmentStatusAction, getActivePaymentAction } from "@/modules/billing/billing.actions";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ArrowLeft, Info, CheckCircle2,
    Copy, QrCode, Calendar, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { User } from "@/modules/user/user.schema";
import { type OnboardingData } from "./OnboardingFlow";
import type { Plan } from "@/modules/billing/billing.schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

const DUE_DAYS = ["1", "5", "10", "15"];

export function StepPayment({
    onNext,
    onBack,
    user,
}: {
    onNext: (data: OnboardingData) => void;
    onBack: () => void;
    user: User;
}) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const [plansLoading, setPlansLoading] = useState(true);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [selectedDueDay, setSelectedDueDay] = useState<string>(
        user.dueDay?.toString() || "10"
    );
    const [pixData, setPixData] = useState<{
        pixPayload: string | null;
        pixImage: string | null;
        expiresAt: Date;
        installmentId: string;
        status: string;
    } | null>(null);
    const [checkingPayment, setCheckingPayment] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            if (user.assignedPlanId) {
                const plansResult = await getPlansAction();
                if (plansResult?.data?.success && plansResult.data.data) {
                    const found = plansResult.data.data.find(
                        (p: Plan) => p.id === user.assignedPlanId
                    );
                    setPlan(found || null);
                }
            }

            const paymentResult = await getActivePaymentAction();
            if (paymentResult?.data?.success && paymentResult.data.data) {
                const payment = paymentResult.data.data;
                if (payment.orderIndex === 1 && payment.pixPayload) {
                    setPixData({
                        pixPayload: payment.pixPayload,
                        pixImage: payment.pixImage,
                        expiresAt: new Date(payment.dueDate),
                        installmentId: payment.installmentId,
                        status: payment.status,
                    });
                    if (user.dueDay) setSelectedDueDay(user.dueDay.toString());
                }
            }

            setPlansLoading(false);
        };
        fetchInitialData();
    }, [user.assignedPlanId, user.dueDay]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pixData && pixData.status !== "paid") {
            interval = setInterval(async () => {
                const result = await getInstallmentStatusAction({
                    installmentId: pixData.installmentId,
                });
                if (result?.data?.success && result.data.data?.status === "paid") {
                    setPixData((prev) =>
                        prev ? { ...prev, status: "paid" } : null
                    );
                    notify.success(t("payment.successTitle") || "Pagamento confirmado!");
                    clearInterval(interval);
                }
            }, 3000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [pixData, t]);

    const calculateProRata = (dueDay: number, price: number) => {
        const today = new Date();
        const classesStart = user.classesStartDate ? new Date(user.classesStartDate) : null;

        // Always use classesStartDate for pro-rata calculation if available
        const billingBaseDate = classesStart || today;

        const currentDay = billingBaseDate.getDate();

        let remainingClasses = 4;
        let isProRata = false;

        if (currentDay >= 20) {
            remainingClasses = 1;
            isProRata = true;
        } else if (currentDay >= 15) {
            remainingClasses = 2;
            isProRata = true;
        } else if (currentDay >= 6) {
            remainingClasses = 3;
            isProRata = true;
        } else {
            remainingClasses = 4;
            isProRata = false;
        }

        const proRataAmount = Math.round((price / 4) * remainingClasses);

        return { amount: proRataAmount, isProRata };
    };

    const handleConfirmDate = async () => {
        setLoading(true);
        const result = await onboardingPaymentAction({
            dueDay: parseInt(selectedDueDay),
        });
        setLoading(false);

        if (result?.data?.success && result.data.data) {
            setPixData(result.data.data);
            notify.success(
                t("payment.invoiceGenerated") || "Cobrança gerada com sucesso!"
            );
        } else {
            notify.error((result?.data as { error?: string })?.error || "Erro ao gerar cobrança");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        notify.success(t("payment.copied") || "Código copiado!");
    };

    const handleCheckPayment = async () => {
        if (!pixData) return;
        setCheckingPayment(true);
        const result = await getInstallmentStatusAction({
            installmentId: pixData.installmentId,
        });
        setCheckingPayment(false);

        if (result?.data?.success) {
            const status = result.data.data?.status;
            if (status === "paid") {
                setPixData((prev) =>
                    prev ? { ...prev, status: "paid" } : null
                );
                notify.success(t("payment.successTitle") || "Pagamento confirmado!");
            } else {
                notify.info(t("payment.pendingCheck") || "Pagamento ainda pendente de confirmação. Se você já pagou, aguarde alguns instantes e tente novamente.");
            }
        } else {
            notify.error(t("payment.errorChecking") || "Erro ao verificar status do pagamento.");
        }
    };

    if (plansLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
        );
    }

    const { amount, isProRata } = plan
        ? calculateProRata(parseInt(selectedDueDay), plan.price)
        : { amount: 0, isProRata: false };

    const today = new Date();
    const classesStart = user.classesStartDate ? new Date(user.classesStartDate) : null;
    const billingBaseDate = classesStart || today;
    const currentDay = billingBaseDate.getDate();

    let calculatedDueDate: Date;
    if (currentDay >= 20) {
        calculatedDueDate = new Date(billingBaseDate.getFullYear(), billingBaseDate.getMonth() + 1, 0);
    } else {
        calculatedDueDate = new Date(billingBaseDate);
        calculatedDueDate.setDate(calculatedDueDate.getDate() + 10);
    }

    const formattedStartDate = classesStart 
        ? format(classesStart, "dd/MM/yyyy") 
        : format(today, "dd/MM/yyyy");

    const formattedDueDate = format(calculatedDueDate, "dd/MM/yyyy");

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">

                {/* ── STATE: Selection ── */}
                {!pixData && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                    >
                        {/* Plan summary */}
                        {plan && (
                            <div className="rounded-md border border-white/[0.07] bg-white/3 p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-200">
                                        {plan.name}
                                    </span>
                                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-0.5 text-[11px] font-medium text-violet-400">
                                        {plan.classesPerWeek} aulas/semana
                                    </span>
                                </div>

                                <div className="border-t border-white/6 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">
                                            {t("payment.totalValue")}
                                        </span>
                                        <span className="text-slate-400">
                                            R$ {(plan.price / 100).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-slate-300">
                                            {t("payment.firstPayment")}
                                        </span>
                                        <span className="text-base font-semibold text-violet-400">
                                            R$ {(amount / 100).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Due day selector */}
                        <div className="space-y-3">
                            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500">
                                {t("payment.dueDay")}
                            </p>
                            <div className="grid grid-cols-4 gap-2.5">
                                {DUE_DAYS.map((day) => {
                                    const isActive = selectedDueDay === day;
                                    return (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDueDay(day)}
                                            className={cn(
                                                "h-14 w-full rounded-md border text-lg font-semibold transition-all duration-200",
                                                isActive
                                                    ? "border-violet-500/50 bg-violet-500/10 text-violet-300"
                                                    : "border-white/[0.07] bg-white/3 text-slate-500 hover:border-white/[0.14] hover:text-slate-300"
                                            )}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pro-rata warning */}
                        {isProRata && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex gap-3 rounded-md border border-blue-500/20 bg-blue-500/[0.07] px-4 py-3 text-sm text-blue-400"
                            >
                                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    {t("payment.prorataWarning", {
                                        classesStartDate: formattedStartDate,
                                        dueDate: formattedDueDate,
                                    })}
                                </span>
                            </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={onBack}
                                disabled={loading}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/8 text-sm text-slate-500 transition-all hover:border-white/[0.14] hover:text-slate-300 disabled:opacity-40"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                {t("steps.back") || "Voltar"}
                            </button>
                            <Button
                                onClick={handleConfirmDate}
                                disabled={loading || !plan}
                                className="flex h-11 flex-2 items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    t("payment.confirmDate") || "Confirmar data"
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}

                {/* ── STATE: PIX generated ── */}
                {pixData && pixData.status !== "paid" && (
                    <motion.div
                        key="pix"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-5"
                    >
                        <div className="overflow-hidden rounded-md border border-white/[0.07] bg-white/3">
                            {/* Header */}
                            <div className="flex items-center gap-2.5 border-b border-white/6 px-5 py-3.5">
                                <QrCode className="h-4 w-4 text-violet-400" />
                                <span className="text-sm font-medium text-slate-400">
                                    {t("payment.payNowTitle") || "Pagar com PIX"}
                                </span>
                            </div>

                            {/* Body */}
                            <div className="flex flex-col items-center gap-5 px-6 py-6">
                                {/* QR Code */}
                                <div className="rounded-md border-4 border-white bg-white p-1 shadow-lg">
                                    {pixData.pixImage ? (
                                        <Image
                                            src={pixData.pixImage}
                                            alt="PIX QR Code"
                                            width={180}
                                            height={180}
                                            className="rounded"
                                        />
                                    ) : (
                                        <div className="flex h-[180px] w-[180px] items-center justify-center bg-slate-100 rounded">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                        </div>
                                    )}
                                </div>

                                {/* Expiry */}
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>
                                        Vence em{" "}
                                        <strong className="font-medium text-slate-400">
                                            {format(new Date(pixData.expiresAt), "dd 'de' MMMM", {
                                                locale: ptBR,
                                            })}
                                        </strong>
                                    </span>
                                </div>

                                {/* Copy-paste */}
                                <div className="w-full space-y-2">
                                    <p className="text-[11px] font-medium uppercase tracking-widest text-slate-600">
                                        {t("payment.copyPaste") || "Copia e Cola"}
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="flex-1 overflow-hidden rounded-lg border border-white/[0.07] bg-white/3 px-3 py-2.5 font-mono text-[11px] text-slate-600 truncate">
                                            {pixData.pixPayload}
                                        </div>
                                        <button
                                            onClick={() =>
                                                copyToClipboard(pixData.pixPayload || "")
                                            }
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/3 text-slate-500 transition-all hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-400"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pay later warning */}
                        <div className="flex gap-3 rounded-md border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-500/80">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                            <span>
                                {t("payment.payLaterWarning") ||
                                    "Você pode pagar agora ou depois. O acesso é liberado assim que o pagamento for identificado."}
                            </span>
                        </div>

                        {/* Navigation */}
                        <div className="flex flex-col gap-2.5">
                            <Button
                                onClick={handleCheckPayment}
                                disabled={checkingPayment}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-500 text-sm font-medium text-white transition-all hover:bg-emerald-400 disabled:opacity-40 hover:scale-[1.01]"
                            >
                                {checkingPayment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    t("payment.checkPaymentBtn") || "Verificar Pagamento"
                                )}
                            </Button>
                            <button
                                onClick={() => onNext({ dueDay: parseInt(selectedDueDay) })}
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/8 text-sm font-medium text-slate-400 transition-all hover:border-white/12 hover:text-slate-300 hover:scale-[1.01]"
                            >
                                {t("payment.payLaterBtn") || "Pagar depois / Próximo"}
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* ── STATE: Paid ── */}
                {pixData && pixData.status === "paid" && (
                    <motion.div
                        key="paid"
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                        className="space-y-5"
                    >
                        <div className="flex flex-col items-center gap-4 rounded-md border border-emerald-500/20 bg-emerald-500/[0.07] px-6 py-10 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-base font-semibold text-emerald-300">
                                    {t("payment.paidTitle") || "Pagamento recebido!"}
                                </p>
                                <p className="text-sm text-emerald-500/70">
                                    {t("payment.paidSubtitle") ||
                                        "Sua primeira mensalidade foi confirmada. Continue para o contrato."}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => onNext({ dueDay: parseInt(selectedDueDay) })}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500"
                        >
                            {t("steps.next") || "Próximo"}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}