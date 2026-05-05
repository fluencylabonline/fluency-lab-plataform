"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toaster";
import { getCertificateDataAction, issueCertificateAction, getStudentCertificatesAction } from "@/modules/certificate/certificate.actions";
import { Certificate } from "@/modules/certificate/certificate.schema";
import { Loader2, Award, Download, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field } from "@/components/ui/field";
import React from "react";

import type { User } from "@/modules/user/user.schema";
import type { LanguageWithLessons } from "@/modules/curriculum/curriculum.types";
import { getLanguagesAction } from "@/modules/curriculum/curriculum.actions";
import type { CertificateData } from "@/modules/certificate/certificate.types";
import { useCallback } from "react";

interface CertificateTabProps {
  user: User;
}

export function CertificateTab({ user }: CertificateTabProps) {
  const studentId = user.id;
  const t = useTranslations("Certificates");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [allLanguages, setAllLanguages] = useState<LanguageWithLessons[]>([]);

  // Fetch languages on mount
  React.useEffect(() => {
    const fetchLanguages = async () => {
      const result = await getLanguagesAction({});
      if (result?.data) {
        setAllLanguages(result.data);
      }
    };
    fetchLanguages();
  }, []);

  // Fetch certificates on mount or after issuing
  const loadCertificates = useCallback(async () => {
    const result = await getStudentCertificatesAction({ studentId });
    if (result?.data?.success && result.data.data) {
      setCertificates(result.data.data);
    }
  }, [studentId]);

  const handleIssue = async () => {
    if (!selectedLanguage) {
      notify.error(t("selectLanguageError"));
      return;
    }

    setIsLoading(true);
    try {
      // 1. Issue the record in DB
      const issueResult = await issueCertificateAction({
        studentId,
        language: selectedLanguage,
      });

      if (!issueResult?.data?.success || !issueResult.data.data) {
        throw new Error(issueResult?.data?.error || t("issueError"));
      }

      const certificate = issueResult.data.data;
      
      // 2. Generate PDF and Upload
      // We need to render the certificate off-screen or temporarily to capture it
      // For this demo, I'll use a simplified version.
      // In a real app, you might want to render a hidden component.
      
      // I'll manually trigger the PDF generation and upload after the record is created.
      // But we need the certificate data (hours, dates, etc.)
      const dataResult = await getCertificateDataAction({ studentId, language: selectedLanguage });
      if (!dataResult?.data?.success || !dataResult.data.data) {
        throw new Error(dataResult?.data?.error || t("fetchError"));
      }
      
      const certData = dataResult.data.data;
      
      // Generate PDF (Client Side)
      const pdf = await generatePdf(certData, certificate.code);
      const pdfBase64 = pdf.output("datauristring");

      // 3. Save PDF and Send Email via API
      const response = await fetch(`/api/admin/certificates/${certificate.code}/pdf`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      });

      if (!response.ok) throw new Error(t("saveError"));

      notify.success(t("issueSuccess"));
      loadCertificates();
    } catch (error) {
      console.error(error);
      notify.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePdf = async (data: CertificateData, code: string) => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Simple Certificate Design
    // Background
    doc.setFillColor(252, 252, 252);
    doc.rect(0, 0, 297, 210, "F");

    // Borders
    doc.setDrawColor(20, 20, 20);
    doc.setLineWidth(2);
    doc.rect(10, 10, 277, 190);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, 273, 186);

    // Content
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(40);
    doc.text("CERTIFICADO DE CONCLUSÃO", 148.5, 50, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text("Certificamos que", 148.5, 75, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.text(data.studentName.toUpperCase(), 148.5, 95, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.text(`concluiu com êxito o curso de ${data.courseLanguage}`, 148.5, 115, { align: "center" });
    
    doc.setFontSize(14);
    doc.text(`Carga horária total: ${data.totalHours} horas`, 148.5, 130, { align: "center" });
    doc.text(`Nível alcançado: ${data.levelLabel} (${data.levelCode})`, 148.5, 140, { align: "center" });

    if (data.startDate && data.endDate) {
      const startStr = format(new Date(data.startDate), "dd/MM/yyyy");
      const endStr = format(new Date(data.endDate), "dd/MM/yyyy");
      doc.text(`Período: ${startStr} a ${endStr}`, 148.5, 150, { align: "center" });
    }

    // Code
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Código de Verificação: ${code}`, 148.5, 180, { align: "center" });
    doc.text(`Verifique em: fluency-lab.com/certificate/${code}`, 148.5, 185, { align: "center" });

    return doc;
  };

  const handleDownload = async (cert: Certificate) => {
    if (!cert.pdfUrl) {
      notify.error(t("pdfNotFoundError"));
      return;
    }
    window.open(cert.pdfUrl, "_blank");
  };

  React.useEffect(() => {
    loadCertificates();
  }, [loadCertificates]);

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5" />
          {t("issueTitle")}
        </h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Field label={t("languageLabel")} className="flex-1">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder={t("languagePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {/* Logic: Show student's languages if they exist, otherwise fallback to all available languages */}
                {(() => {
                  const studentLanguages = allLanguages.filter(lang => 
                    user.languages?.some(ul => ul.toLowerCase() === lang.code.toLowerCase())
                  );
                  
                  const displayLanguages = studentLanguages.length > 0 
                    ? studentLanguages 
                    : allLanguages;

                  if (displayLanguages.length === 0 && !isLoading) {
                    return <SelectItem value="none" disabled>Nenhum idioma disponível</SelectItem>;
                  }

                  return displayLanguages.map(lang => (
                    <SelectItem key={lang.id} value={lang.code.toLowerCase()}>
                      {lang.name}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </Field>

          <Button 
            onClick={handleIssue} 
            disabled={isLoading || !selectedLanguage}
            className="w-full md:w-auto"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            {t("issueButton")}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-4 italic">
          {t("description")}
        </p>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">{t("issuedTitle")}</h3>
        
        {certificates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Award className="w-12 h-12 mb-2 opacity-20" />
            <p>{t("emptyState")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="item p-4 flex flex-col gap-3 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium">{cert.courseLanguage}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(cert.issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono bg-secondary px-1.5 py-0.5 rounded">
                      {cert.code}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{t("levelLabel")}</p>
                    <p className="font-semibold">{cert.levelCode}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="text-muted-foreground">{t("hoursLabel")}</p>
                    <p className="font-semibold">{cert.hours}h</p>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                  onClick={() => handleDownload(cert)}
                >
                  <Download className="w-3 h-3 mr-2" />
                  {t("viewButton")}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
