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
import { BackButton } from "@/components/ui/back-button";

import type { User } from "../user.schema";
import { updateUserAction } from "../user.actions";
import { getContractDownloadUrlAction } from "../../contract/contract.actions";
import { updateInstallmentAction } from "../../billing/billing.actions";
import { PersonalInfoTab } from "./userDetails/PersonalInfoTab";
import { StudentPaymentTab } from "./userDetails/StudentPaymentTab";
import { TeacherEarningsTab } from "./userDetails/TeacherEarningsTab";
import { ContractsTab } from "./userDetails/ContractsTab";
import { TeacherScheduleTab } from "./userDetails/TeacherScheduleTab";
import { StudentCurriculumTab } from "./userDetails/StudentCurriculumTab";
import { Header } from "@/components/layout/header";

const rateSchema = z.object({
  rate: z.number().min(0),
});

const installmentSchema = z.object({
  amount: z.number().optional(),
});

interface UserDetailsClientProps {
  user: User;
  currentUser: User;
  activeSubscription?: any;
  installments?: any[];
  subscriptions?: any[];
  teacherClasses?: any[];
  earningsSummary?: { count: number; total: number };
  contracts?: any[];
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
    } catch (error) {
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
      });

      if (result?.data?.success) {
        notify.success(t("installmentUpdated"));
        router.refresh();
      } else {
        notify.error(result?.data?.error || t("updateError"));
      }
    } catch (error) {
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
    } catch (error) {
      notify.error(t("updateError"));
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
    } catch (error) {
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
    } catch (error) {
      notify.error("Erro ao processar solicitação");
    }
  };

  const userInitials = user.name ? user.name.charAt(0).toUpperCase() : "U";
  const userAvatar = (user as any).avatarUrl || (user as any).image;

  return (
    <div>
      <Header
        title="Detalhes do Usuário"
        showSubHeader={false}
        className="contents"
        user={currentUser}
      />
      <Tabs defaultValue="personal" className="container">
        <div className="flex flex-col items-start md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-row gap-2 items-center">
            <BackButton href={basePath} />
            <div className="flex items-center">
              <Avatar className="h-12 w-12">
                <AvatarImage src={userAvatar} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="ml-3">
                <p className="capitalize text-2xl font-bold">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <TabsList className="mt-0 flex-wrap h-full">
            <TabsTrigger value="personal">{t("personalInfo")}</TabsTrigger>

            {(user.role === "student" || user.role === "teacher") && (
              <TabsTrigger value="payment">
                {user.role === "student" ? t("payment") : t("earningsStatement")}
              </TabsTrigger>
            )}

            <TabsTrigger value="contracts">{t("contracts")}</TabsTrigger>

            {user.role === "teacher" && (
              <TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
            )}

            {user.role === "student" && (
              <TabsTrigger value="curriculum">Currículo</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="personal" className="mt-4">
          <PersonalInfoTab
            user={user}
            isAdmin={isAdmin}
            isUpdating={isUpdating}
            rateForm={rateForm}
            onUpdateRate={handleUpdateRate}
          />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          {user.role === "student" ? (
            <StudentPaymentTab
              activeSubscription={activeSubscription}
              installments={installments}
              subscriptions={subscriptions}
              isAdmin={isAdmin}
              isUpdating={isUpdating}
              adminPassword={adminPassword}
              setAdminPassword={setAdminPassword}
              installmentForm={installmentForm}
              onUpdateInstallment={handleUpdateInstallment}
              onMarkAsPaid={handleMarkAsPaid}
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
      </Tabs>
    </div>
  );
}