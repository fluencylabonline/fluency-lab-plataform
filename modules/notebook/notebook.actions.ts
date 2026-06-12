"use server";

import { revalidatePath } from "next/cache";
import { protectedAction } from "@/lib/safe-action";
import { createNotebookSchema } from "./notebook.schema";
import { notebookService } from "./notebook.service";
import { z } from "zod";

/**
 * Creates a new notebook for a student.
 * Only teachers and admins can call this.
 */
export const createNotebookAction = protectedAction
  .schema(createNotebookSchema)
  .metadata({ name: "createNotebookAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    if (user.role !== "teacher" && user.role !== "admin") {
      throw new Error("Only teachers can create notebooks");
    }

    const notebook = await notebookService.createNotebook(user.id, {
      title: parsedInput.title,
      studentId: parsedInput.studentId,
    });

    // Sync to Firestore (for Firestore security rules on the Notebooks collection)
    try {
      const { adminDb } = await import("@/lib/firebase-admin");
      await adminDb.collection("Notebooks").doc(notebook.id).set({
        title: notebook.title,
        studentId: notebook.studentId,
        teacherId: notebook.teacherId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("[createNotebookAction] Firestore sync error:", error);
    }

    // Sync metadata to RTDB so ownership-based security rules can validate reads/writes.
    // The RTDB rules check notebooks/{id}/metadata/studentId and teacherId before allowing access.
    try {
      const { adminRtdb } = await import("@/lib/firebase-admin");
      await adminRtdb
        .ref(`notebooks/${notebook.id}/metadata`)
        .set({
          studentId: notebook.studentId,
          teacherId: notebook.teacherId,
          createdAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error("[createNotebookAction] RTDB metadata sync error:", error);
      // Non-fatal: the notebook will still exist but RTDB access will be blocked
      // until the metadata is written. It will be retried on the next access.
    }


    revalidatePath(`/hub/teacher/students/${parsedInput.studentId}`);

    return { notebook };
  });


/**
 * Lists notebooks for a student.
 */
export const getStudentNotebooksAction = protectedAction
  .schema(z.object({ studentId: z.string() }))
  .metadata({ name: "getStudentNotebooksAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    const notebooks = await notebookService.getNotebooksForStudent(
      user.id,
      user.role,
      parsedInput.studentId
    );

    return { notebooks };
  });

/**
 * Starts a new usage session for a notebook.
 */
export const startNotebookSessionAction = protectedAction
  .schema(z.object({ notebookId: z.string().uuid() }))
  .metadata({ name: "startNotebookSessionAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const session = await notebookService.startNotebookSession(
      user.id,
      user.role,
      parsedInput.notebookId
    );
    return { sessionId: session.id };
  });

/**
 * Updates a session's heartbeat to track active time.
 */
export const heartbeatNotebookSessionAction = protectedAction
  .schema(z.object({ sessionId: z.string().uuid() }))
  .metadata({ name: "heartbeatNotebookSessionAction" })
  .action(async ({ parsedInput, ctx }) => {
    await notebookService.heartbeatNotebookSession(parsedInput.sessionId, ctx.user.id);
    return { success: true };
  });

/**
 * Ends a session explicitly and saves a content snapshot.
 */
export const endNotebookSessionAction = protectedAction
  .schema(z.object({ 
    sessionId: z.string().uuid(),
    content: z.string().optional()
  }))
  .metadata({ name: "endNotebookSessionAction" })
  .action(async ({ parsedInput, ctx }) => {
    await notebookService.endNotebookSession(parsedInput.sessionId, ctx.user.id, parsedInput.content);
    return { success: true };
  });

/**
 * Registers an uploaded image asset for a notebook.
 */
export const registerNotebookAssetAction = protectedAction
  .schema(z.object({
    notebookId: z.string().uuid(),
    filePath: z.string().min(1),
    fileName: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().positive(),
  }))
  .metadata({ name: "registerNotebookAssetAction" })
  .action(async ({ parsedInput, ctx }) => {
    await notebookService.registerNotebookAsset({
      ...parsedInput,
      uploadedBy: ctx.user.id,
      userRole: ctx.user.role,
    });
    return { success: true };
  });

/**
 * Gets a single notebook by ID.
 */
export const getNotebookAction = protectedAction
  .schema(z.object({ notebookId: z.string().uuid() }))
  .metadata({ name: "getNotebookAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const notebook = await notebookService.getNotebook(
      user.id,
      user.role,
      parsedInput.notebookId
    );
    return { notebook };
  });

/**
 * Generates an AI quiz of 10 questions for a notebook.
 * Only teachers and admins can call this.
 */
export const generateNotebookQuizAction = protectedAction
  .schema(z.object({
    notebookId: z.string().uuid(),
    studentId: z.string(),
    content: z.string().min(1),
    nativeLanguage: z.string().min(1),
    targetLanguage: z.string().min(1),
    level: z.string().min(1)
  }))
  .metadata({ name: "generateNotebookQuizAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    if (user.role !== "teacher" && user.role !== "admin") {
      throw new Error("Only teachers can generate quizzes");
    }

    const { quizData, usageCount } = await notebookService.generateQuiz(
      user.id,
      parsedInput.studentId,
      parsedInput.notebookId,
      parsedInput.content,
      parsedInput.nativeLanguage,
      parsedInput.targetLanguage,
      parsedInput.level
    );

    revalidatePath(`/notebook/${parsedInput.notebookId}`);

    return { quizData, usageCount };
  });

/**
 * Gets the current quiz generation count for a student-teacher pair.
 */
export const getQuizLimitCountAction = protectedAction
  .schema(z.object({ studentId: z.string() }))
  .metadata({ name: "getQuizLimitCountAction" })
  .action(async ({ parsedInput, ctx }) => {
    const count = await notebookService.getQuizLimitCount(ctx.user.id, parsedInput.studentId);
    return { count };
  });

/**
 * Soft deletes a notebook.
 */
export const deleteNotebookAction = protectedAction
  .schema(z.object({ notebookId: z.string().uuid() }))
  .metadata({ name: "deleteNotebookAction" })
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;
    const notebook = await notebookService.getNotebook(user.id, user.role, parsedInput.notebookId);
    await notebookService.deleteNotebook(user.id, user.role, parsedInput.notebookId);
    
    revalidatePath(`/hub/teacher/students/${notebook.studentId}`);
    return { success: true };
  });

