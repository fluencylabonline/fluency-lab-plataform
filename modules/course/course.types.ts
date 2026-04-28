import { 
  coursesTable, 
  courseSectionsTable, 
  courseLessonsTable, 
  courseEnrollmentsTable,
  courseQuizzesTable,
  courseQuizSubmissionsTable,
  type LessonContentBlock,
  type QuizQuestion
} from "./course.schema";

export type { LessonContentBlock, QuizQuestion };

export type Course = typeof coursesTable.$inferSelect;
export type Section = typeof courseSectionsTable.$inferSelect;
export type Quiz = typeof courseQuizzesTable.$inferSelect;
export type QuizSubmission = typeof courseQuizSubmissionsTable.$inferSelect;
export type Lesson = typeof courseLessonsTable.$inferSelect & {
  quiz?: (Quiz & { lastSubmission?: QuizSubmission | null }) | null;
};
export type Enrollment = typeof courseEnrollmentsTable.$inferSelect;

export type StudentCourse = Course & {
  sectionCount: number;
  lessonCount: number;
  isEnrolled: boolean;
  enrollment: Enrollment | null;
  progressPercentage: number;
};
