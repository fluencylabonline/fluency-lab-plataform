"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { ProfileCard } from "@/modules/user/_components/ProfileCard";
import { Badges } from "./Badges";
import { NextClassCard } from "./NextClassCard";
import { StudentPaymentStatusCard } from "./StudentPaymentStatusCard";
import { PaymentOverdueVault } from "./PaymentOverdueVault";
import { ProgressStatusCard } from "./ProgressStatusCard";
import { OnboardingStatusCard, type OnboardingVariant } from "./OnboardingStatusCard";
import { StreakWidget } from "./StreakWidget";
import { PracticeStatusWidget } from "./PracticeStatusWidget";
import { useTranslations } from "next-intl";
import { HelpCircle } from "lucide-react";
import { StudentHelpWizard } from "../../_components/StudentHelpWizard";
import type { User } from "@/modules/user/user.schema";
import type { StudentProficiency } from "@/utils/proficiency";

type SubscriptionData = {
  subscriptionId: string;
  subscriptionStatus: string;
  planName: string | undefined;
  currency: string;
  currentInstallment: {
    id: string;
    amount: number;
    dueDate: Date;
    status: string;
    pixCode: string | null;
    pixQrCode: string | null;
    orderIndex: number;
    totalMonths: number;
  } | null;
  lastPaymentDate: Date | null;
} | null;

type NextClassMapped = {
  id: string;
  startsAt: Date;
  endsAt: Date;
  teacherName: string;
  teacherPhoto: string | null;
  topic?: string | null;
} | null;

type OnboardingData = {
  contract: { status: OnboardingVariant; label: string };
  placement: { status: OnboardingVariant; label: string };
};

type CurriculumStats = {
  upcomingClassesCount: number;
  planLessonsCount: number;
  gap: number;
  hasGap: boolean;
  activePlanName: string | undefined;
  activePlanId: string | undefined;
  totalClasses: number;
  completedClasses: number;
  classesWithLesson: number;
  profileId: string | undefined;
};

interface StudentProfileClientProps {
  user: User;
  subscriptionData: SubscriptionData;
  nextClassMapped: NextClassMapped;
  onboardingData: OnboardingData;
  proficiencies: StudentProficiency[];
  retentionRate: number;
  vocabularyLevel: number;
  curriculumStats: CurriculumStats;
  practiceStatus: {
    status: "up_to_date" | "late" | "free";
    daysLate?: number;
  };
}

export function StudentProfileClient({
  user,
  subscriptionData,
  nextClassMapped,
  onboardingData,
  proficiencies,
  retentionRate,
  vocabularyLevel,
  curriculumStats,
  practiceStatus,
}: StudentProfileClientProps) {
  const t = useTranslations("Hub.Profile");
  const th = useTranslations("StudentHelpWizard");
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("student-profile-wizard-seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsHelpOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCompleteHelp = () => {
    localStorage.setItem("student-profile-wizard-seen", "true");
  };

  const headerActions = [
    {
      icon: <HelpCircle className="h-5 w-5" />,
      onClick: () => setIsHelpOpen(true),
      label: th("common.helpLabel") || "Ajuda",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={t("title")}
        user={user}
        showSubHeader={false}
        className="contents"
        actions={headerActions}
      />

      <main className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {/* Column 1: Identity & Onboarding */}
          <div className="flex flex-col gap-3">
            <ProfileCard user={user} />
            <OnboardingStatusCard
              contract={onboardingData.contract}
              placement={onboardingData.placement}
            />
            <Badges proficiencies={proficiencies} />
          </div>

          {/* Column 2: Performance & Achievements */}
          <div className="flex flex-col gap-3">
            <ProgressStatusCard
              retentionRate={retentionRate}
              vocabularyLevel={vocabularyLevel}
              totalClasses={curriculumStats.totalClasses}
              completedClasses={curriculumStats.completedClasses}
            />
            <StreakWidget streak={user.streakCount} />
            <PracticeStatusWidget
              status={practiceStatus.status}
              daysLate={practiceStatus.daysLate}
            />
          </div>

          {/* Column 3: Financial & Scheduling */}
          <div className="flex flex-col gap-3">
            <StudentPaymentStatusCard subscription={subscriptionData} />
            <NextClassCard nextClass={nextClassMapped} studentId={user.id} />
          </div>
        </div>
        <PaymentOverdueVault subscription={subscriptionData} />
      </main>

      <StudentHelpWizard
        page="profile"
        open={isHelpOpen}
        onOpenChange={setIsHelpOpen}
        onComplete={handleCompleteHelp}
      />
    </div>
  );
}
