import { learningPlans, planLessons } from "./learning.schema";

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

export type LearningPlan = typeof learningPlans.$inferSelect;
export type PlanLesson = typeof planLessons.$inferSelect;

export type LearningPlanWithLessons = LearningPlan & {
  lessons: Array<PlanLesson & {
    lesson?: {
      title: string;
      id: string;
    };
  }>;
};

