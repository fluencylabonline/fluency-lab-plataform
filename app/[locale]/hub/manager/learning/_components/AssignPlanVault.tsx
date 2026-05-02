"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { assignPlanAction } from "@/modules/learning/learning.actions";
import { searchStudentsAction } from "@/modules/user/user.actions";
import { useSearch } from "@/hooks/data/use-search";
import { useState, useTransition } from "react";
import { User } from "@/modules/user/user.schema";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { SearchBar } from "@/components/ui/search-bar";
import {
    Vault,
    VaultContent,
    VaultHeader,
    VaultTitle,
    VaultDescription,
    VaultBody,
    VaultForm,
    VaultField,
    VaultPrimaryButton,
    VaultSecondaryButton,
    VaultFooter,
    VaultIcon
} from "@/components/ui/vault";
import { notify } from "@/components/ui/toaster";
import { Check, Info, Loader2, Search } from "lucide-react";

const assignPlanSchema = z.object({
    studentId: z.string().min(1, { message: "Validation.required" }),
});

type AssignPlanValues = z.infer<typeof assignPlanSchema>;

interface AssignPlanVaultProps {
    templateId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssignPlanVault({ templateId, open, onOpenChange }: AssignPlanVaultProps) {
    const t = useTranslations("Learning");
    const [isPending, startTransition] = useTransition();
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const {
        results: students,
        isSearching,
    } = useSearch<User>(searchTerm, searchStudentsAction, { domain: "students" });

    const form = useForm<AssignPlanValues>({
        resolver: zodResolver(assignPlanSchema),
        defaultValues: {
            studentId: "",
        },
    });

    const onSubmit = (values: AssignPlanValues) => {
        startTransition(async () => {
            const result = await assignPlanAction({
                templateId,
                studentId: values.studentId
            });

            if (result?.data?.success) {
                notify.success(t("plan_created_success"));
                onOpenChange(false);
                form.reset();
                setSelectedStudent(null);
            } else {
                notify.error(result?.serverError || t("plan_created_error"));
            }
        });
    };

    return (
        <Vault open={open} onOpenChange={onOpenChange}>
            <VaultContent>
                <VaultHeader>
                    <VaultIcon type="user" />
                    <VaultTitle>{t("assign_plan")}</VaultTitle>
                    <VaultDescription>{t("assign_plan_desc")}</VaultDescription>
                </VaultHeader>

                <VaultForm onSubmit={form.handleSubmit(onSubmit)}>
                    <VaultBody className="space-y-6">
                        {/* Search Block */}
                        {!selectedStudent ? (
                            <VaultField
                                label={t("student")}
                                required
                                error={form.formState.errors.studentId?.message}
                            >
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <SearchBar
                                            placeholder={t("student_placeholder")}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                }
                                            }}
                                            className="h-12"
                                            autoFocus
                                            rightIcon={isSearching && <Loader2 className="animate-spin size-4" />}
                                        />
                                    </div>

                                    {/* Results List */}
                                    {students.length > 0 && (
                                        <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-50 dark:divide-gray-900 animate-in fade-in slide-in-from-top-2">
                                            {students.map((student) => (
                                                <button
                                                    key={student.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStudent(student);
                                                        form.setValue("studentId", student.id);
                                                        setSearchTerm("");
                                                    }}
                                                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group/item"
                                                >
                                                    <Avatar className="size-10">
                                                        <AvatarImage src={student.photoUrl || undefined} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                            {student.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col flex-1">
                                                        <span className="font-semibold text-foreground group-hover/item:text-primary transition-colors">{student.name}</span>
                                                        <span className="text-xs text-muted-foreground">{student.email}</span>
                                                    </div>
                                                    <div className="size-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <Check className="size-4 text-primary" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Empty Search State */}
                                    {!isSearching && searchTerm.length >= 2 && students.length === 0 && (
                                        <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                                            <div className="inline-flex size-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-3">
                                                <Search className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">{t("noResults")}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{t("try_different_term")}</p>
                                        </div>
                                    )}

                                    {/* Onboarding State */}
                                    {!isSearching && students.length === 0 && searchTerm.length < 2 && (
                                        <div className="p-6 text-center text-muted-foreground">
                                            <p className="text-sm italic">{t("type_to_search")}</p>
                                        </div>
                                    )}
                                </div>
                            </VaultField>
                        ) : (
                            /* Selected Student Card */
                            <VaultField label={t("student")}>
                                <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-primary/10 border-2 border-primary/20 rounded-2xl animate-in zoom-in-95 group">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-12 border-2 border-white dark:border-gray-900 shadow-sm transition-transform group-hover:scale-105">
                                            <AvatarImage src={selectedStudent.photoUrl || undefined} />
                                            <AvatarFallback className="bg-primary/20 text-primary font-black">
                                                {selectedStudent.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground text-lg">{selectedStudent.name}</span>
                                            <span className="text-sm text-primary/70">{selectedStudent.email}</span>
                                        </div>
                                    </div>
                                    <VaultSecondaryButton
                                        type="button"
                                        onClick={() => {
                                            setSelectedStudent(null);
                                            form.setValue("studentId", "");
                                        }}
                                        className="h-9 px-3 text-xs bg-white dark:bg-gray-950"
                                    >
                                        {t("change")}
                                    </VaultSecondaryButton>
                                </div>
                            </VaultField>
                        )}

                        <div className="p-4 bg-amber-50/50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                            <Info className="size-5 text-amber-500 shrink-0" />
                            <p className="text-sm text-amber-900/80 dark:text-amber-200/60 leading-relaxed italic">
                                {t("assignment_note")}
                            </p>
                        </div>
                    </VaultBody>

                    <VaultFooter>
                        <VaultPrimaryButton
                            type="submit"
                            className="w-full"
                            disabled={isPending || !selectedStudent}
                        >
                            {isPending ? (
                                <>
                                    <div className="size-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>{t("assigning")}...</span>
                                </>
                            ) : (
                                t("assign")
                            )}
                        </VaultPrimaryButton>
                    </VaultFooter>
                </VaultForm>
            </VaultContent>
        </Vault>
    );
}
