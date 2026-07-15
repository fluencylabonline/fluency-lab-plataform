"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { notify } from "@/components/ui/toaster";

import type { User } from "../user.schema";
import type { SubscriptionWithPlan, Installment } from "../../billing/billing.types";
import type { SlotInstanceWithDetails } from "../../scheduling/scheduling.types";
import type { ContractWithTemplate } from "../../contract/contract.types";
import { updateUserAction } from "../user.actions";
import { getContractDownloadUrlAction } from "../../contract/contract.actions";
import { updateInstallmentAction, generateInstallmentInvoiceAction, resendInstallmentReminderAction } from "../../billing/billing.actions";
import { PersonalInfoTab } from "./userDetails/PersonalInfoTab";
import { StudentPaymentTab } from "./userDetails/StudentPaymentTab";
import { TeacherEarningsTab } from "./userDetails/TeacherEarningsTab";
import { ContractsTab } from "./userDetails/ContractsTab";
import { TeacherScheduleTab } from "./userDetails/TeacherScheduleTab";
import { StudentCurriculumTab } from "./userDetails/StudentCurriculumTab";
import { VideoCallsTab } from "./userDetails/VideoCallsTab";
import { ActionsTab } from "./userDetails/ActionsTab";
import { CertificateTab } from "./userDetails/CertificateTab";
import { StudentPlanTab } from "./userDetails/StudentPlanTab";
import { Header } from "@/components/layout/header";
import type { CallSession } from "../../call/call.schema";

const rateSchema = z.object({
  rate: z.number().min(0),
});

const installmentSchema = z.object({
  amount: z.number().optional(),
});

interface UserDetailsClientProps {
  user: User;
  currentUser: User;
  activeSubscription?: SubscriptionWithPlan | null;
  installments?: Installment[];
  subscriptions?: SubscriptionWithPlan[];
  teacherClasses?: SlotInstanceWithDetails[];
  earningsSummary?: { count: number; total: number };
  contracts?: ContractWithTemplate[];
  callHistory?: CallSession[];
  basePath: string;
  isAdmin: boolean;
}

export function UserDetailsClient({
  user,
  currentUser,
  activeSubscription,
  installments = [],
  subscriptions = [],
  teacherClasses = [],
  earningsSummary = { count: 0, total: 0 },
  contracts = [],
  callHistory = [],
  basePath,
  isAdmin,
}: UserDetailsClientProps) {
  const t = useTranslations("UserManagement");
  const router = useRouter();

  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingContractId, setLoadingContractId] = useState<string | null>(null);
  const [adminPassword, setAdminPassword] = useState("");

  const rateForm = useForm({
    resolver: zodResolver(rateSchema),
    defaultValues: { rate: user.teacherHourlyRate / 100 },
  });

  const installmentForm = useForm({
    resolver: zodResolver(installmentSchema),
  });

  const handleUpdateRate = async (data: { rate: number }) => {
    setIsUpdating(true);
    try {
      const result = await updateUserAction({
        id: user.id,
        teacherHourlyRate: Math.round(data.rate * 100),
      });

      if (result?.data?.success) {
        notify.success(t("hourlyRateUpdated"));
        router.refresh();
      } else {
        notify.error(result?.data?.error || t("updateError"));
      }
    } catch {
      notify.error(t("updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateInstallment = async (id: string, data: { amount?: number }) => {
    setIsUpdating(true);
    try {
      const result = await updateInstallmentAction({
        id: id,
        amount: data.amount ? Math.round(data.amount * 100) : undefined,
        password: adminPassword,
      });

      if (result?.data?.success) {
        notify.success(t("installmentUpdated"));
        setAdminPassword("");
        router.refresh();
      } else {
        notify.error(result?.data?.error || t("updateError"));
      }
    } catch {
      notify.error(t("updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    if (!adminPassword) return;
    setIsUpdating(true);
    try {
      const result = await updateInstallmentAction({
        id: id,
        status: "paid",
        password: adminPassword,
      });

      if (result?.data?.success) {
        notify.success(t("paymentConfirmed"));
        setAdminPassword("");
        router.refresh();
      } else {
        notify.error(result?.data?.error || t("authError"));
      }
    } catch {
      notify.error(t("updateError"));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateInvoice = async (id: string, options?: { force?: boolean }) => {
    setIsUpdating(true);
    try {
      const result = await generateInstallmentInvoiceAction({
        installmentId: id,
        force: options?.force,
      });

      if (result?.data?.success) {
        notify.success(
          options?.force
            ? t("regenerateInvoiceSuccess") || "Nova cobrança gerada com sucesso!"
            : t("invoiceGeneratedSuccess") || "Código de pagamento gerado com sucesso!"
        );
        router.refresh();
      } else {
        notify.error(result?.data?.error || "Erro ao gerar código de pagamento.");
      }
    } catch {
      notify.error("Erro ao processar solicitação.");
    } finally {
      setIsUpdating(false);
    }
  };


  const handleResendReminder = async (id: string) => {
    setIsUpdating(true);
    try {
      const result = await resendInstallmentReminderAction({
        installmentId: id,
      });

      if (result?.data?.success) {
        notify.success(t("reminderSentSuccess") || "Lembrete enviado com sucesso!");
      } else {
        notify.error(result?.data?.error || "Erro ao reenviar lembrete.");
      }
    } catch {
      notify.error("Erro ao processar solicitação.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewContract = async (id: string) => {
    setLoadingContractId(id);
    try {
      const result = await getContractDownloadUrlAction({ instanceId: id });
      if (result?.data?.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
      } else {
        notify.error(result?.data?.error || "Erro ao carregar contrato");
      }
    } catch {
      notify.error("Erro ao processar solicitação");
    } finally {
      setLoadingContractId(null);
    }
  };

  const handleDownloadContract = async (id: string) => {
    try {
      const result = await getContractDownloadUrlAction({ instanceId: id });
      if (result?.data?.success && result.data.downloadUrl) {
        const link = document.createElement("a");
        link.href = result.data.downloadUrl;
        link.setAttribute("download", `contrato_${id}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        notify.error(result?.data?.error || "Erro ao baixar contrato");
      }
    } catch {
      notify.error("Erro ao processar solicitação");
    }
  };

  const userInitials = user.name ? user.name.charAt(0).toUpperCase() : "U";
  const userAvatar = user.photoUrl || undefined;

  return (
    <div>
      <Header
        title="Detalhes do Usuário"
        showSubHeader={false}
        className="contents"
        user={currentUser}
        backHref={basePath}
      />
      <Tabs defaultValue="personal" className="container">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-row gap-2 items-center">
            <div className="flex items-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userAvatar} />
                <AvatarFallback name={user.name}>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="capitalize text-2xl font-bold min-w-full">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <TabsList className="mt-0 py-4 flex w-full justify-start overflow-x-auto flex-nowrap scrollbar-hide h-full bg-transparent border-none">

            <TabsTrigger
              value="personal"
              className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
            >
              {t("personalInfo")}
            </TabsTrigger>

            {(user.role === "student" || user.role === "teacher") && (
              <TabsTrigger
                value="payment"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                {user.role === "student" ? t("payment") : t("earningsStatement")}
              </TabsTrigger>
            )}
            {user.role === "teacher" ||  user.role === "student" && (
            <TabsTrigger
              value="contracts"
              className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
            >
              {t("contracts")}
            </TabsTrigger>)}

            {user.role === "teacher" && (
              <TabsTrigger
                value="schedule"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                {t("schedule")}
              </TabsTrigger>
            )}

            {user.role === "student" && (
              <TabsTrigger
                value="curriculum"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                Currículo
              </TabsTrigger>
            )}

            {user.role === "student" && (
              <TabsTrigger
                value="video-calls"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                Aulas
              </TabsTrigger>
            )}

            {user.role === "student" && isAdmin && (
              <TabsTrigger
                value="actions"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                {t("actions")}
              </TabsTrigger>
            )}

            {user.role === "student" && (isAdmin || currentUser.role === "manager") && (
              <TabsTrigger
                value="certificate"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                Certificado
              </TabsTrigger>
            )}

            {user.role === "student" && (isAdmin || currentUser.role === "manager") && (
              <TabsTrigger
                value="plan"
                className="shrink-0 data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-[state=active]:text-primary! data-[state=active]:border-none! focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
              >
                Plano
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="personal" className="mt-4">
          <PersonalInfoTab
            user={user}
            isAdmin={isAdmin}
            isUpdating={isUpdating}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rateForm={rateForm as any}
            onUpdateRate={handleUpdateRate}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          {user.role === "student" ? (
            <StudentPaymentTab
              activeSubscription={activeSubscription ?? null}
              installments={installments}
              subscriptions={subscriptions}
              isAdmin={isAdmin}
              isUpdating={isUpdating}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              installmentForm={installmentForm as any}
              onUpdateInstallment={handleUpdateInstallment}
              onMarkAsPaid={handleMarkAsPaid}
              onGenerateInvoice={handleGenerateInvoice}
              onResendReminder={handleResendReminder}
            />
          ) : (
            <TeacherEarningsTab
              user={user}
              teacherClasses={teacherClasses}
              earningsSummary={earningsSummary}
              isAdmin={isAdmin}
            />
          )}
        </TabsContent>

        <TabsContent value="contracts" className="mt-4">
          <ContractsTab
            contracts={contracts}
            onViewContract={handleViewContract}
            onDownloadContract={handleDownloadContract}
            loadingContractId={loadingContractId}
          />
        </TabsContent>

        {user.role === "teacher" && (
          <TabsContent value="schedule" className="mt-4">
            <TeacherScheduleTab teacherId={user.id} />
          </TabsContent>
        )}

        {user.role === "student" && (
          <TabsContent value="curriculum" className="mt-4">
            <StudentCurriculumTab studentId={user.id} isAdmin={isAdmin} />
          </TabsContent>
        )}

        {user.role === "student" && (
          <TabsContent value="video-calls" className="mt-4">
            <VideoCallsTab callHistory={callHistory} />
          </TabsContent>
        )}

        {user.role === "student" && isAdmin && (
          <TabsContent value="actions" className="mt-4">
            <ActionsTab
              userId={user.id}
              userName={user.name || ""}
              isActive={user.isActive ?? true}
              activeSubscription={activeSubscription}
              installments={installments}
            />
          </TabsContent>
        )}

        {user.role === "student" && (isAdmin || currentUser.role === "manager") && (
          <TabsContent value="certificate" className="mt-4">
            <CertificateTab user={user} />
          </TabsContent>
        )}

        {user.role === "student" && (isAdmin || currentUser.role === "manager") && (
          <TabsContent value="plan" className="mt-4">
            <StudentPlanTab
              user={user}
              activeSubscription={activeSubscription}
              isAdmin={isAdmin || currentUser.role === "manager"}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}