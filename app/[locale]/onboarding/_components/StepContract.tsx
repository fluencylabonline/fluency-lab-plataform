"use client";

import DOMPurify from "dompurify";
import { useTranslations } from "next-intl";
import { signContractAction, getPendingContractAction } from "@/modules/contract/contract.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Download, ArrowRight, FileText } from "lucide-react";
import { injectTemplateData } from "@/modules/contract/contract.service.utils";
import type { User } from "@/modules/user/user.schema";
import type { ContractInstance, ContractTemplate } from "@/modules/contract/contract.schema";

export function StepContract({
    onNext,
    onBack,
    user,
}: {
    onNext: () => void;
    onBack: () => void;
    user: User;
}) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const [contractLoading, setContractLoading] = useState(true);
    const [contract, setContract] = useState<(ContractInstance & { template?: ContractTemplate }) | null>(null);
    const [signed, setSigned] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchContract = async () => {
            const result = await getPendingContractAction();
            if (result?.data?.success && result.data?.data) {
                setContract(result.data.data);
                if (result.data.data.status === "signed") {
                    setSigned(true);
                    setDownloadUrl(result.data?.downloadUrl || null);
                }
            }
            setContractLoading(false);
        };
        fetchContract();
    }, []);

    const onSign = async () => {
        if (!contract) return;
        setLoading(true);

        // Basic fingerprint for audit
        const fingerprint = [
            navigator.language,
            screen.colorDepth,
            new Date().getTimezoneOffset(),
            navigator.userAgent.split(" ").slice(-1)[0] // Simple UA hint
        ].join("|");

        const signResult = await signContractAction({
            instanceId: contract.id,
            fingerprint,
            guardianData: user.guardianName
                ? {
                    name: user.guardianName,
                    taxId: user.guardianTaxId || "",
                    relationship: user.guardianRelationship || "",
                }
                : undefined,
        });

        setLoading(false);

        if (signResult?.data?.success) {
            setSigned(true);
            setDownloadUrl(signResult.data?.downloadUrl || null);
            notify.success(t("contract.success") || "Contrato assinado!");
        } else {
            notify.error(signResult?.data?.error || "Erro ao assinar contrato");
        }
    };

    // ── Loading ──
    if (contractLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary/60" />
            </div>
        );
    }

    // ── Signed state ──
    if (signed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-col items-center gap-6 py-8 text-center"
            >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>

                <div className="space-y-1.5">
                    <p className="text-xl font-semibold text-emerald-300">
                        {t("contract.success") || "Contrato assinado!"}
                    </p>
                    <p className="text-sm text-slate-500">
                        {t("contract.signedSuccessDesc") || "Sua assinatura foi processada e registrada com sucesso."}
                    </p>
                </div>

                <div className="flex w-full flex-col gap-3 pt-2">
                    {downloadUrl && (
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/8 text-sm text-slate-400 transition-all hover:border-white/[0.14] hover:text-slate-200"
                        >
                            <Download className="h-4 w-4" />
                            {t("contract.downloadPdf") || "Baixar contrato (PDF)"}
                        </a>
                    )}
                    <button
                        onClick={onNext}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500"
                    >
                        {t("steps.next") || "Próximo"}
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </motion.div>
        );
    }

    // ── Contract preview ──
    const previewContent = contract?.template
        ? injectTemplateData(contract.template.content, {
            user: {
                name: user.name || "",
                email: user.email || "",
                taxId: user.taxId || "",
                businessTaxId: user.businessTaxId || "",
                pixKey: user.pixKey || "",
            },
            guardian: user.guardianName
                ? {
                    name: user.guardianName,
                    taxId: user.guardianTaxId || "",
                    relationship: user.guardianRelationship || "",
                }
                : undefined,
            school: {
                name: "FluencyLab",
                legalName: "FluencyLab LTDA",
                taxId: "00.000.000/0001-00",
                representativeName: "Diretoria",
            },
            date: new Date().toLocaleDateString("pt-BR"),
        })
        : "";

    const sanitizedPreview = DOMPurify.sanitize(previewContent);

    return (
        <div className="space-y-6">

            {/* Contract scroll area */}
            {contract ? (
                <div className="overflow-hidden rounded-md border border-white/[0.07] bg-white/3">
                    {/* Header */}
                    <div className="flex items-center gap-2.5 border-b border-white/6 px-5 py-3.5">
                        <FileText className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium text-slate-400">
                            {t("contract.title")}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="h-[380px] overflow-y-auto px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
                        <div
                            className="prose prose-sm prose-invert max-w-none text-slate-400 leading-relaxed
                                prose-headings:text-slate-300 prose-headings:font-medium
                                prose-strong:text-slate-300 prose-strong:font-medium
                                prose-p:text-slate-500"
                            dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                        />
                    </div>
                </div>
            ) : (
                <p className="text-sm text-red-400/80">
                    {t("contract.loadError") || "Erro ao carregar contrato. Entre em contato com o suporte."}
                </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={loading}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-white/8 text-sm text-slate-500 transition-all hover:border-white/[0.14] hover:text-slate-300 disabled:opacity-40"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("steps.back") || "Voltar"}
                </button>

                <button
                    onClick={onSign}
                    disabled={loading || !contract}
                    className="flex h-11 flex-2 items-center justify-center gap-2 rounded-md bg-violet-600 text-sm font-medium text-white transition-all hover:bg-violet-500 disabled:opacity-40"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        t("contract.signButton")
                    )}
                </button>
            </div>
        </div>
    );
}