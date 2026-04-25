"use client";

import { useTranslations } from "next-intl";
import { signContractAction, getPendingContractAction } from "@/modules/contract/contract.actions";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, CheckCircle2, Download, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { injectTemplateData } from "@/modules/contract/contract.service.utils";
import type { User } from "@/modules/user/user.schema";

export function StepContract({ onNext, onBack, user }: { onNext: () => void; onBack: () => void; user: User }) {
    const t = useTranslations("Onboarding");
    const [loading, setLoading] = useState(false);
    const [contractLoading, setContractLoading] = useState(true);
    const [contract, setContract] = useState<any>(null);
    const [signed, setSigned] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchContract = async () => {
            const result = await getPendingContractAction();
            if (result?.data?.success && result.data?.data) {
                setContract(result.data.data);
                // Check if already signed
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

        const signResult = await signContractAction({
            instanceId: contract.id,
            guardianData: user.guardianName ? {
                name: user.guardianName,
                taxId: user.guardianTaxId || "",
                relationship: user.guardianRelationship || "",
            } : undefined
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

    if (contractLoading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (signed) {
        return (
            <div className="flex flex-col items-center justify-center space-y-8 py-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 p-4 rounded-full">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold">{t("contract.success") || "Contrato Assinado!"}</h2>
                    <p className="text-muted-foreground">Sua assinatura foi processada e registrada com sucesso.</p>
                </div>

                <div className="flex flex-col w-full gap-4 pt-4">
                    {downloadUrl && (
                        <Button variant="outline" className="h-12">
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Baixar Contrato (PDF)
                            </a>
                        </Button>
                    )}
                    <Button onClick={onNext} className="h-12 text-lg font-bold">
                        {t("steps.next") || "Próximo"}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>
            </div>
        );
    }

    // Prepare preview content
    const previewContent = contract?.template ? injectTemplateData(contract.template.content, {
        user: {
            name: user.name || "",
            email: user.email || "",
            taxId: user.taxId || "",
        },
        guardian: user.guardianName ? {
            name: user.guardianName,
            taxId: user.guardianTaxId || "",
            relationship: user.guardianRelationship || "",
        } : undefined,
        school: {
            name: "FluencyLab",
            legalName: "FluencyLab LTDA",
            taxId: "00.000.000/0001-00",
            representativeName: "Diretoria",
        },
        date: new Date().toLocaleDateString("pt-BR"),
    }) : "";

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold">{t("contract.title")}</h2>
                <p className="text-muted-foreground">{t("contract.subtitle")}</p>
            </div>

            {contract ? (
                <div className="border border-border rounded-xl overflow-hidden bg-white dark:bg-black/20 shadow-inner">
                    <ScrollArea className="h-[400px] p-6">
                        <div
                            className="prose dark:prose-invert max-w-none text-sm text-foreground/80 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: previewContent }}
                        />
                    </ScrollArea>
                </div>
            ) : (
                <p className="text-destructive">Erro ao carregar contrato. Entre em contato com o suporte.</p>
            )}

            <div className="flex gap-4">
                <Button type="button" variant="outline" className="flex-1" onClick={onBack} disabled={loading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> {t("steps.back") || "Voltar"}
                </Button>
                <Button onClick={onSign} className="flex-[2]" disabled={loading || !contract}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : t("contract.signButton")}
                </Button>
            </div>
        </div>
    );
}
