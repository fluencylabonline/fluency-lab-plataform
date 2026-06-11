"use client";

import DOMPurify from "dompurify";
import { useTranslations } from "next-intl";
import { signContractAction, getPendingContractAction } from "@/modules/contract/contract.actions";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2, Download, ArrowRight, FileText, LayoutList } from "lucide-react";
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
    user: User & {
        guardianData?: {
            name?: string;
            taxId?: string;
            relationship?: string;
        };
    };
}) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const [contractLoading, setContractLoading] = useState(true);
    const [contract, setContract] = useState<(ContractInstance & { template?: ContractTemplate }) | null>(null);
    const [signed, setSigned] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"summary" | "full">("summary");

    const isTeacher = user.role === "teacher";
    const summaryData = isTeacher
        ? [
            { title: "Relação Comercial", desc: "Prestação de serviços autônomos como MEI (Pessoa Jurídica). Sem exclusividade e sem vínculo de emprego." },
            { title: "Remuneração por Aula", desc: "Pagamento mensal por hora-aula executada, efetuado até o 10º dia útil mediante emissão de Nota Fiscal (NFS-e)." },
            { title: "Disponibilidade Mínima (SLA)", desc: "Manutenção de cadastro ativo vinculada a manter pelo menos 2 horários regulares e 2 de reposição semanais." },
            { title: "Recessos e Ausências", desc: "Parada geral de 4 semanas no fim do ano (sem faturamento). Folgas individuais planejadas com 30 dias de aviso." },
            { title: "Rescisão Contratual", desc: "Aviso prévio mínimo de 30 dias para encerramento imotivado por qualquer uma das partes." }
          ]
        : [
            { title: "Aulas e Frequência", desc: "Videoconferências online. Falta sem aviso prévio de 24h ou falhas na sua internet contam como aula realizada." },
            { title: "Remarcações de Aulas", desc: "Limite de 2 remarcações por mês com antecedência mínima de 24h. Reposição garantida se o professor desmarcar." },
            { title: "Mensalidades e Reajustes", desc: "Pagamento entre os dias 1º e 10 de cada mês (proporcional no 1º mês). Reajuste anual calculado no mês de julho." },
            { title: "Recesso de Fim de Ano", desc: "Sem aulas por 4 semanas (fim de dezembro e início de janeiro). Mensalidades mantidas, com opção de conteúdo extra." },
            { title: "Troca de Professor", desc: "Direito de alteração do docente pela escola a qualquer momento para garantir a evolução e qualidade pedagógica." },
            { title: "Gravação das Aulas", desc: "Aulas gravadas para auditoria de qualidade e segurança interna. Proibida gravação externa e distribuição do material." },
            { title: "Rescisão e Multa", desc: "Multa compensatória de 50% de uma mensalidade caso cancele antes do fim dos meses de vigência." }
          ];

    const guardian = user.guardianName
        ? {
            name: user.guardianName,
            taxId: user.guardianTaxId || "",
            relationship: user.guardianRelationship || "",
          }
        : user.guardianData?.name
            ? {
                name: user.guardianData.name,
                taxId: user.guardianData.taxId || "",
                relationship: user.guardianData.relationship || "",
              }
            : undefined;

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
            guardianData: guardian,
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
            guardian,
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

            {/* Contract scroll area / Summary */}
            {contract ? (
                <div className="space-y-4">
                    {/* Tabs switcher */}
                    <div className="flex rounded-lg bg-white/5 p-1 border border-white/[0.05] w-full">
                        <button
                            type="button"
                            onClick={() => setActiveTab("summary")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all cursor-pointer ${
                                activeTab === "summary"
                                    ? "bg-violet-600 text-white font-semibold"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <LayoutList className="h-3.5 w-3.5" />
                            {t("contract.summaryTab") || "Resumo dos Termos"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("full")}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-xs font-medium transition-all cursor-pointer ${
                                activeTab === "full"
                                    ? "bg-violet-600 text-white font-semibold"
                                    : "text-slate-400 hover:text-slate-200"
                            }`}
                        >
                            <FileText className="h-3.5 w-3.5" />
                            {t("contract.fullTab") || "Contrato Completo"}
                        </button>
                    </div>

                    {/* Content container */}
                    <div className="overflow-hidden rounded-md border border-white/[0.07] bg-white/3 min-h-[380px] flex flex-col">
                        {activeTab === "summary" ? (
                            <div className="flex-1 px-6 py-5 overflow-y-auto max-h-[380px] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent] space-y-4">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                                    {t("contract.summaryTitle") || "Principais regras do seu contrato"}
                                </p>
                                <div className="space-y-3">
                                    {summaryData.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-start p-3.5 rounded-lg bg-white/[0.02] border border-white/[0.03] transition-all hover:bg-white/[0.04]">
                                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 border border-violet-500/20 mt-0.5">
                                                <CheckCircle2 className="h-3 w-3 text-violet-400" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <h4 className="text-sm font-semibold text-slate-300">{item.title}</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                {/* Header */}
                                <div className="flex items-center gap-2.5 border-b border-white/6 px-5 py-3.5 bg-white/[0.01]">
                                    <FileText className="h-4 w-4 text-violet-400" />
                                    <span className="text-sm font-medium text-slate-400">
                                        {t("contract.title")}
                                    </span>
                                </div>
                                {/* Content */}
                                <div className="h-[320px] overflow-y-auto px-6 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]">
                                    <div
                                        className="prose prose-sm prose-invert max-w-none text-slate-400 leading-relaxed
                                            prose-headings:text-slate-300 prose-headings:font-medium
                                            prose-strong:text-slate-300 prose-strong:font-medium
                                            prose-p:text-slate-500"
                                        dangerouslySetInnerHTML={{ __html: sanitizedPreview }}
                                    />
                                </div>
                            </div>
                        )}
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