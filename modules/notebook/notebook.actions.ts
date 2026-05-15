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

    // Initialize Firestore document for security rules
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
      // We don't fail the whole action if Firestore sync fails, 
      // but the notebook won't be accessible until fixed.
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
