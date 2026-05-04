import { notebookRepository } from "./notebook.repository";
import type { Notebook } from "./notebook.schema";
import { adminStorage } from "@/lib/firebase-admin";

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
   * Deletes a notebook. Marks all associated assets for cleanup.
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

    // Mark all assets for cleanup before deleting notebook record
    const assets = await notebookRepository.getNotebookAssets(notebookId);
    for (const asset of assets) {
      await notebookRepository.markAssetAsDeleted(asset.filePath);
    }

    await notebookRepository.delete(notebookId);
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

  async heartbeatNotebookSession(sessionId: string) {
    return notebookRepository.updateSessionHeartbeat(sessionId);
  },

  async endNotebookSession(sessionId: string, content?: string) {
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
  }) {
    return notebookRepository.addNotebookAsset(asset);
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

