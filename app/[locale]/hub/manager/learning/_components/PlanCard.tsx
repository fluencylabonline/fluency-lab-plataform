"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    MoreHorizontal,
    UserPlus,
    ArrowRight,
    CheckCircle2,
    Clock,
    Languages
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { AssignPlanVault } from "./AssignPlanVault";
import { Link } from "@/i18n/navigation";

interface PlanCardProps {
    plan: {
        id: string;
        name: string;
        description: string | null;
        language: { id: string; name: string } | null;
        status: string;
        lessonsCount: number;
    };
}

export function PlanCard({ plan }: PlanCardProps) {
    const t = useTranslations("Learning");
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    const statusColors: Record<string, string> = {
        draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
        approved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    };

    const statusIcons: Record<string, React.ReactNode> = {
        draft: <Clock className="w-3 h-3 mr-1" />,
        approved: <CheckCircle2 className="w-3 h-3 mr-1" />,
    };

    return (
        <>
            <div className="card group relative flex flex-col p-5">
                {/* Header Info */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/5 dark:bg-primary/10 rounded-xl">
                            <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                                {plan.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="h-5 px-2 bg-gray-50 dark:bg-gray-800 text-[10px] uppercase tracking-wider font-bold">
                                    <Languages className="w-3 h-3 mr-1" />
                                    {plan.language?.name || "N/A"}
                                </Badge>
                                <Badge className={`h-5 px-2 text-[10px] uppercase tracking-wider font-bold border ${statusColors[plan.status] || ""}`}>
                                    {statusIcons[plan.status]}
                                    {t(`status_${plan.status}`) || plan.status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors outline-none">
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl border-gray-200 dark:border-gray-800">
                            <DropdownMenuItem asChild className="cursor-pointer py-2.5 rounded-lg">
                                <Link href={`/hub/manager/learning/${plan.id}`}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    {t("edit_path") || "Edit Path"}
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsAssignOpen(true)}
                                className="cursor-pointer py-2.5 rounded-lg text-primary"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                {t("assign_to_student") || "Assign Student"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-6 min-h-[40px]">
                    {plan.description || t("no_description") || "No description provided for this template."}
                </p>

                {/* Footer Metrics */}
                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {plan.lessonsCount}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {t("lessons") || "Lessons"}
                        </span>
                    </div>

                    <Link
                        href={`/hub/manager/learning/${plan.id}`}
                        className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all"
                    >
                        {t("view_details") || "View Details"}
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <AssignPlanVault
                templateId={plan.id}
                open={isAssignOpen}
                onOpenChange={setIsAssignOpen}
            />
        </>
    );
}
