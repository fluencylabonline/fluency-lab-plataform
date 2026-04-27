export interface StudentCurriculumGap {
    upcomingClassesCount: number;
    planLessonsCount: number;
    gap: number;
    hasGap: boolean;
    activePlanName?: string;
    activePlanId?: string;
    totalClasses: number;
    completedClasses: number;
    classesWithLesson: number;
}
