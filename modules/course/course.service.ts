import { courseRepository } from "./course.repository";
import { type User } from "@/modules/user/user.schema";
import { hasPermission } from "@/lib/rbac";
import { adminStorage } from "@/lib/firebase-admin";
import { notificationService } from "@/modules/notification/notification.service";

import { 
  insertCourseSchema, 
  insertSectionSchema, 
  insertLessonSchema, 
  insertQuizSchema,
  type QuizQuestion
} from "./course.schema";
import { type Quiz, type QuizSubmission } from "./course.types";
import { z } from "zod";

export const courseService = {
  // Admin Actions
  async createCourse(user: User, data: z.infer<typeof insertCourseSchema>) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized: You do not have permission to manage courses.");
    }
    return courseRepository.create(data);
  },

  async getAllCourses(user: User) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized: You do not have permission to manage courses.");
    }
    return courseRepository.findAll();
  },

  async updateCourse(user: User, courseId: string, data: Partial<z.infer<typeof insertCourseSchema>>) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized: You do not have permission to manage courses.");
    }
    const result = await courseRepository.update(courseId, data);
    
    // Notify if published
    if (result.isPublished) {
      await this.notifyCourseUpdate(courseId, `O curso "${result.title}" foi atualizado.`);
    }
    
    return result;
  },

  async notifyCourseUpdate(courseId: string, message: string, actionUrl?: string) {
    const userIds = await courseRepository.findEnrolledUserIds(courseId);
    if (userIds.length === 0) return;

    const course = await courseRepository.findById(courseId);
    if (!course) return;

    await notificationService.sendNotification({
      title: `Atualização: ${course.title}`,
      body: message,
      actionUrl: actionUrl || `/hub/student/courses/${courseId}`,
      targetType: "specific",
      userIds,
      channels: { inApp: true, push: true }
    });
  },

  async deleteCourse(user: User, courseId: string) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized: You do not have permission to manage courses.");
    }

    const course = await courseRepository.findById(courseId);
    if (course?.imageUrl && course.imageUrl.includes("firebasestorage")) {
      try {
        const bucket = adminStorage.bucket();
        // Extract file path from Firebase Storage URL
        const decodedUrl = decodeURIComponent(course.imageUrl);
        const urlPart = decodedUrl.split("/o/")[1];
        if (urlPart) {
          const filePath = urlPart.split("?")[0];
          await bucket.file(filePath).delete();
        }
      } catch (error) {
        console.error("[courseService.deleteCourse] Error deleting image from storage:", error);
      }
    }

    return courseRepository.delete(courseId);
  },

  // Student Actions
  async getStudentCourses(user: User) {
    if (!hasPermission(user, "course.view")) {
      throw new Error("Unauthorized: You do not have permission to view courses.");
    }
    const courses = await courseRepository.findStudentCourses(user.id);
    
    // Map to the extended StudentCourse type
    return courses.map(course => {
      const isEnrolled = course.enrollments.length > 0;
      const enrollment = isEnrolled ? course.enrollments[0] : null;
      
      let totalLessons = 0;
      course.sections.forEach(s => totalLessons += s.lessons.length);

      let completedLessons = 0;
      if (enrollment) {
        completedLessons = Object.values(enrollment.progress.lessons).filter(p => p === 100).length;
      }

      const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      return {
        ...course,
        sectionCount: course.sections.length,
        lessonCount: totalLessons,
        isEnrolled,
        enrollment,
        progressPercentage,
      };
    });
  },

  async getCourseDetails(user: User, courseId: string, studentId?: string) {
    if (!hasPermission(user, "course.view")) {
      throw new Error("Unauthorized: You do not have permission to view courses.");
    }
    const course = await courseRepository.findById(courseId);
    if (!course) return null;

    // Fetch last submission for each quiz if studentId is provided
    if (studentId) {
      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          if (lesson.quizId) {
            const lastSubmission = await courseRepository.findLastSubmission(studentId, lesson.quizId);
            if (lesson.quiz) {
              (lesson.quiz as Quiz & { lastSubmission?: QuizSubmission | null }).lastSubmission = lastSubmission;
            }
          }
        }
      }
    }

    const studentCount = await courseRepository.countEnrollments(courseId);

    return {
      course: {
        id: course.id,
        title: course.title,
        language: course.language,
        description: course.description,
        imageUrl: course.imageUrl,
        duration: course.duration,
        isPublished: course.isPublished,
        role: course.role,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      },
      sections: course.sections,
      studentCount,
    };
  },

  async enroll(user: User, courseId: string) {
    if (!hasPermission(user, "course.learn")) {
      throw new Error("Unauthorized: You do not have permission to enroll in courses.");
    }
    return courseRepository.upsertEnrollment({
      userId: user.id,
      courseId: courseId,
      enrolledAt: new Date(),
      completed: false,
      progress: { lessons: {} },
      updatedAt: new Date(),
    });
  },

  async updateProgress(user: User, courseId: string, lessonId: string, percentage: number) {
    if (!hasPermission(user, "course.learn")) {
      throw new Error("Unauthorized: You do not have permission to track progress.");
    }
    
    const enrollment = await courseRepository.findEnrollment(user.id, courseId);
    if (!enrollment) {
      throw new Error("Not enrolled in this course.");
    }

    const currentProgress = enrollment.progress;
    currentProgress.lessons[lessonId] = percentage;

    // Check if all lessons are completed (simple logic for now)
    // In a real app, we'd check against total lesson count
    
    return courseRepository.updateProgress(user.id, courseId, currentProgress);
  },

  async addSection(user: User, data: z.infer<typeof insertSectionSchema>) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    const section = await courseRepository.createSection(data);
    await this.notifyCourseUpdate(data.courseId, `Nova seção adicionada: ${section.title}`);
    return section;
  },

  async deleteSection(user: User, sectionId: string) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.deleteSection(sectionId);
  },

  async reorderSections(user: User, sectionIds: string[]) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.updateSectionsOrder(sectionIds);
  },

  async addLesson(user: User, data: z.infer<typeof insertLessonSchema> & { courseId: string }) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    const { courseId, ...lessonData } = data;
    const lesson = await courseRepository.createLesson(lessonData);
    await this.notifyCourseUpdate(courseId, `Nova aula adicionada: ${lesson.title}`);
    return lesson;
  },

  async deleteLesson(user: User, lessonId: string) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.deleteLesson(lessonId);
  },

  async updateLesson(user: User, courseId: string, lessonId: string, data: Partial<z.infer<typeof insertLessonSchema>>) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    const result = await courseRepository.updateLesson(lessonId, data);
    await this.notifyCourseUpdate(courseId, `A aula "${result.title}" foi atualizada.`);
    return result;
  },

  async getLessonDetails(user: User, lessonId: string) {
    if (!hasPermission(user, "course.view")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.findLessonById(lessonId);
  },

  async reorderLessons(user: User, lessonIds: string[]) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.updateLessonsOrder(lessonIds);
  },

  // Quizzes
  async createQuiz(user: User, data: z.infer<typeof insertQuizSchema>) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.createQuiz({
      ...data,
      updatedAt: new Date(),
    });
  },

  async getQuiz(user: User, quizId: string) {
    if (!hasPermission(user, "course.view")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.findQuizById(quizId);
  },

  async getQuizzesByCourse(user: User, courseId: string) {
    if (!hasPermission(user, "course.manage")) {
      throw new Error("Unauthorized");
    }
    return courseRepository.findQuizzesByCourse(courseId);
  },

  async submitQuiz(user: User, quizId: string, answers: Record<string, string>) {
    if (!hasPermission(user, "course.learn")) {
      throw new Error("Unauthorized");
    }

    const quiz = await courseRepository.findQuizById(quizId);
    if (!quiz) throw new Error("Quiz not found");

    let correctCount = 0;
    quiz.questions.forEach((q: QuizQuestion) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const submission = await courseRepository.createQuizSubmission({
      userId: user.id,
      quizId,
      answers,
      score,
      passed,
    });

    // If passed, we might want to mark the associated lesson as completed automatically
    // but for now let's just return the result
    return {
      submission,
      score,
      passed,
      correctCount,
      totalCount: quiz.questions.length,
    };
  }
};
