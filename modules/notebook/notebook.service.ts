import { notebookRepository } from "./notebook.repository";
import type { Notebook } from "./notebook.schema";
import { adminStorage } from "@/lib/firebase-admin";
import { aiService } from "@/modules/ai/ai.service";

export const notebookService = {
  /**
   * Creates a notebook for a student.
   * Only teachers (and admins) can do this — RBAC is enforced at the Action layer
   * via `protectedAction`, but we double-check ownership intent here.
   */
  async createNotebook(
    teacherId: string,
    data: { title: string; studentId: string }
  ): Promise<Notebook> {
    const notebook = await notebookRepository.create({
      title: data.title.trim(),
      studentId: data.studentId,
      teacherId,
    });

    return notebook;
  },

  /**
   * Returns notebooks for a student.
   * Teachers see only their own; admins/managers see all.
   */
  async getNotebooksForStudent(
    requesterId: string,
    requesterRole: string,
    studentId: string
  ): Promise<Notebook[]> {
    if (requesterRole === "admin" || requesterRole === "manager") {
      return notebookRepository.findByStudent(studentId);
    }

    if (requesterRole === "teacher") {
      return notebookRepository.findByStudentAndTeacher(studentId, requesterId);
    }

    // Students can only see their own notebooks
    if (requesterRole === "student") {
      if (requesterId !== studentId) {
        throw new Error("Unauthorized");
      }
      return notebookRepository.findByStudent(studentId);
    }

    throw new Error("Unauthorized");
  },

  /**
   * Returns a single notebook, verifying that the requester has access.
   */
  async getNotebook(
    requesterId: string,
    requesterRole: string,
    notebookId: string
  ): Promise<Notebook> {
    const notebook = await notebookRepository.findById(notebookId);

    if (!notebook) throw new Error("Notebook not found");

    if (requesterRole === "admin" || requesterRole === "manager") {
      return notebook;
    }

    if (requesterRole === "teacher" && notebook.teacherId === requesterId) {
      return notebook;
    }

    if (requesterRole === "student" && notebook.studentId === requesterId) {
      return notebook;
    }

    throw new Error("Unauthorized");
  },

  /**
   * Deletes a notebook (soft delete).
   */
  async deleteNotebook(
    requesterId: string,
    requesterRole: string,
    notebookId: string
  ): Promise<void> {
    const notebook = await notebookRepository.findById(notebookId);

    if (!notebook) throw new Error("Notebook not found");

    if (
      requesterRole !== "admin" &&
      notebook.teacherId !== requesterId
    ) {
      throw new Error("Unauthorized");
    }

    await notebookRepository.softDelete(notebookId);
  },

  /**
   * Final cleanup for soft-deleted notebooks.
   * Deletes the notebook, sessions, and files from Firebase Storage, Firestore, RTDB.
   * This is called by a CRON job for notebooks deleted > 60 days.
   */
  async cleanupExpiredNotebooks() {
    const THRESHOLD_DAYS = 60;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - THRESHOLD_DAYS);

    const expiredNotebooks = await notebookRepository.getExpiredNotebooks(thresholdDate);
    const bucket = adminStorage.bucket();

    const results = {
      total: expiredNotebooks.length,
      deleted: 0,
      errors: 0,
    };

    for (const notebook of expiredNotebooks) {
      try {
        // 1. Delete associated Firebase Storage files
        const assets = await notebookRepository.getNotebookAssets(notebook.id);
        for (const asset of assets) {
          try {
            const file = bucket.file(asset.filePath);
            const [exists] = await file.exists();
            if (exists) {
              await file.delete();
            }
          } catch (storageErr) {
            console.error(`[cleanupExpiredNotebooks] Storage delete failed for ${asset.filePath}:`, storageErr);
          }
        }

        // 2. Delete Firestore record
        try {
          const { adminDb } = await import("@/lib/firebase-admin");
          await adminDb.collection("Notebooks").doc(notebook.id).delete();
        } catch (firestoreErr) {
          console.error(`[cleanupExpiredNotebooks] Firestore delete failed for notebook ${notebook.id}:`, firestoreErr);
        }

        // 3. Delete RTDB path
        try {
          const { adminRtdb } = await import("@/lib/firebase-admin");
          await adminRtdb.ref(`notebooks/${notebook.id}`).remove();
        } catch (rtdbErr) {
          console.error(`[cleanupExpiredNotebooks] RTDB delete failed for notebook ${notebook.id}:`, rtdbErr);
        }

        // 4. Delete the notebook record in PostgreSQL. Cascade will delete related DB records.
        await notebookRepository.delete(notebook.id);
        results.deleted++;
      } catch (err) {
        console.error(`[cleanupExpiredNotebooks] Failed to completely clean up notebook ${notebook.id}:`, err);
        results.errors++;
      }
    }

    return results;
  },

  // --- Session Tracking ---

  async startNotebookSession(
    userId: string,
    userRole: string,
    notebookId: string
  ) {
    // First verify access
    await this.getNotebook(userId, userRole, notebookId);

    return notebookRepository.createSession({
      notebookId,
      userId,
    });
  },

  async heartbeatNotebookSession(sessionId: string, requesterId: string) {
    const session = await notebookRepository.findSessionById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.userId !== requesterId) throw new Error("Unauthorized");

    return notebookRepository.updateSessionHeartbeat(sessionId);
  },

  async endNotebookSession(sessionId: string, requesterId: string, content?: string) {
    const sessionRecord = await notebookRepository.findSessionById(sessionId);
    if (!sessionRecord) throw new Error("Session not found");
    if (sessionRecord.userId !== requesterId) throw new Error("Unauthorized");

    const session = await notebookRepository.endSession(sessionId);
    
    if (session && content) {
      await notebookRepository.updateNotebookContent(session.notebookId, content);
      // Sync assets (soft-delete images removed from editor)
      await this.syncNotebookAssets(session.notebookId, content);
    }

    return session;
  },

  // --- Asset Management ---

  async registerNotebookAsset(asset: {
    notebookId: string;
    filePath: string;
    fileName: string;
    contentType: string;
    sizeBytes: number;
    uploadedBy: string;
    userRole: string;
  }) {
    // Security: Verify that the uploader has access to the notebook
    await this.getNotebook(asset.uploadedBy, asset.userRole, asset.notebookId);

    return notebookRepository.addNotebookAsset({
      notebookId: asset.notebookId,
      filePath: asset.filePath,
      fileName: asset.fileName,
      contentType: asset.contentType,
      sizeBytes: asset.sizeBytes,
      uploadedBy: asset.uploadedBy,
    });
  },

  /**
   * Synchronizes assets recorded in the DB with the actual images present in the HTML.
   * If an image is missing from the HTML, it's marked as deleted (soft delete).
   * If it's present but was previously marked as deleted, it's unmarked (undo support).
   */
  async syncNotebookAssets(notebookId: string, html: string) {
    const currentPathsInHtml = extractStoragePaths(html);
    const recordedAssets = await notebookRepository.getNotebookAssets(notebookId);

    for (const asset of recordedAssets) {
      const isPresent = currentPathsInHtml.includes(asset.filePath);
      
      if (isPresent && asset.deletedAt) {
        // Image was restored (Undo)
        await notebookRepository.unmarkAssetAsDeleted(asset.filePath);
      } else if (!isPresent && !asset.deletedAt) {
        // Image was removed from editor
        await notebookRepository.markAssetAsDeleted(asset.filePath);
      }
    }
  },

  /**
   * Final cleanup: Deletes files from Storage that were marked as deleted long ago.
   * This is called by a CRON job.
   */
  async cleanupExpiredAssets() {
    const THRESHOLD_DAYS = 30;
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - THRESHOLD_DAYS);

    const expiredAssets = await notebookRepository.getExpiredAssets(thresholdDate);
    const bucket = adminStorage.bucket();

    const results = {
      total: expiredAssets.length,
      deleted: 0,
      errors: 0,
    };

    for (const asset of expiredAssets) {
      try {
        const file = bucket.file(asset.filePath);
        const [exists] = await file.exists();
        
        if (exists) {
          await file.delete();
        }

        await notebookRepository.deleteAssetRecord(asset.filePath);
        results.deleted++;
      } catch (error) {
        console.error(`[cleanupExpiredAssets] Failed to delete ${asset.filePath}:`, error);
        results.errors++;
      }
    }

    return results;
  },

  async getQuizLimitCount(teacherId: string, studentId: string): Promise<number> {
    return notebookRepository.getQuizLimitCount(teacherId, studentId);
  },

  async generateQuiz(
    teacherId: string,
    studentId: string,
    notebookId: string,
    content: string,
    nativeLanguage: string,
    targetLanguage: string,
    level: string
  ) {
    // 1. Verify access to the notebook
    const notebook = await notebookRepository.findById(notebookId);
    if (!notebook) throw new Error("Notebook not found");

    // 2. Check the generation limit (Max 3 quizzes per student by this teacher)
    const currentCount = await notebookRepository.getQuizLimitCount(teacherId, studentId);
    if (currentCount >= 3) {
      throw new Error("Você atingiu o limite de 3 quizes gerados para este aluno.");
    }

    // 3. Call AI Service to generate the quiz questions
    const quizData = await aiService.generateNotebookQuizFromContent(
      content,
      nativeLanguage,
      targetLanguage,
      level,
      teacherId
    );

    // 4. Increment the generation limit counter
    const newCount = await notebookRepository.incrementQuizLimitCount(teacherId, studentId);

    return {
      quizData,
      usageCount: newCount
    };
  },
};

/**
 * Helper to extract Firebase Storage paths from HTML <img> tags.
 * Expected format: .../o/notebooks%2F[notebookId]%2F[filename]?...
 */
function extractStoragePaths(html: string): string[] {
  const regex = /notebooks%2F[^?&"']+/g;
  const matches = html.match(regex) || [];
  return Array.from(new Set(matches.map(m => decodeURIComponent(m))));
}

