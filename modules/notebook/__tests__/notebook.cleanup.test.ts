import { describe, it, expect, vi, beforeEach } from "vitest";
import { notebookService } from "../notebook.service";
import { notebookRepository } from "../notebook.repository";
import { adminStorage } from "@/lib/firebase-admin";

vi.mock("@/lib/firebase-admin", () => {
  const mockFileDelete = vi.fn().mockResolvedValue(true);
  const mockFileExists = vi.fn().mockResolvedValue([true]);
  const mockFile = {
    delete: mockFileDelete,
    exists: mockFileExists,
  };
  
  const mockBucket = {
    file: vi.fn().mockReturnValue(mockFile),
  };

  const mockDocDelete = vi.fn().mockResolvedValue(true);
  const mockDoc = {
    delete: mockDocDelete,
  };
  const mockCollection = vi.fn().mockReturnValue({
    doc: vi.fn().mockReturnValue(mockDoc),
  });

  const mockRefRemove = vi.fn().mockResolvedValue(true);
  const mockRef = {
    remove: mockRefRemove,
  };
  const mockRtdb = {
    ref: vi.fn().mockReturnValue(mockRef),
  };

  return {
    adminStorage: {
      bucket: vi.fn().mockReturnValue(mockBucket),
    },
    adminDb: {
      collection: mockCollection,
    },
    adminRtdb: mockRtdb,
  };
});

vi.mock("../notebook.repository", () => ({
  notebookRepository: {
    findById: vi.fn(),
    softDelete: vi.fn(),
    delete: vi.fn(),
    getExpiredNotebooks: vi.fn(),
    getNotebookAssets: vi.fn(),
  },
}));

describe("Notebook Soft Delete and Cleanup Retention", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteNotebook (Soft Delete)", () => {
    it("should soft delete the notebook if requester has permissions", async () => {
      const mockNotebook = {
        id: "notebook-id",
        title: "Test Notebook",
        studentId: "student-1",
        teacherId: "teacher-1",
        content: "Hello",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(notebookRepository.findById).mockResolvedValue(mockNotebook);
      vi.mocked(notebookRepository.softDelete).mockResolvedValue(undefined);

      await notebookService.deleteNotebook("teacher-1", "teacher", "notebook-id");

      expect(notebookRepository.findById).toHaveBeenCalledWith("notebook-id");
      expect(notebookRepository.softDelete).toHaveBeenCalledWith("notebook-id");
      expect(notebookRepository.delete).not.toHaveBeenCalled();
    });

    it("should throw if notebook is not found", async () => {
      vi.mocked(notebookRepository.findById).mockResolvedValue(undefined);

      await expect(
        notebookService.deleteNotebook("teacher-1", "teacher", "notebook-id")
      ).rejects.toThrow("Notebook not found");

      expect(notebookRepository.softDelete).not.toHaveBeenCalled();
    });

    it("should throw if requester has no permission", async () => {
      const mockNotebook = {
        id: "notebook-id",
        title: "Test Notebook",
        studentId: "student-1",
        teacherId: "teacher-1",
        content: "Hello",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(notebookRepository.findById).mockResolvedValue(mockNotebook);

      await expect(
        notebookService.deleteNotebook("teacher-2", "teacher", "notebook-id")
      ).rejects.toThrow("Unauthorized");

      expect(notebookRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe("cleanupExpiredNotebooks", () => {
    it("should fetch expired notebooks and delete DB record, Firestore, RTDB, and Storage files", async () => {
      const expiredNotebook = {
        id: "notebook-1",
        title: "Expired Notebook",
        studentId: "student-1",
        teacherId: "teacher-1",
        content: "Expired",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: new Date(),
      };

      const mockAsset = {
        id: "asset-1",
        notebookId: "notebook-1",
        filePath: "notebooks/notebook-1/img.png",
        fileName: "img.png",
        contentType: "image/png",
        sizeBytes: 1234,
        uploadedBy: "teacher-1",
        createdAt: new Date(),
        deletedAt: null,
      };

      vi.mocked(notebookRepository.getExpiredNotebooks).mockResolvedValue([expiredNotebook]);
      vi.mocked(notebookRepository.getNotebookAssets).mockResolvedValue([mockAsset]);
      vi.mocked(notebookRepository.delete).mockResolvedValue(undefined);

      const results = await notebookService.cleanupExpiredNotebooks();

      expect(notebookRepository.getExpiredNotebooks).toHaveBeenCalled();
      expect(notebookRepository.getNotebookAssets).toHaveBeenCalledWith("notebook-1");

      const bucket = adminStorage.bucket();
      expect(bucket.file).toHaveBeenCalledWith("notebooks/notebook-1/img.png");
      
      const file = bucket.file("notebooks/notebook-1/img.png");
      expect(file.delete).toHaveBeenCalled();
      expect(notebookRepository.delete).toHaveBeenCalledWith("notebook-1");
      
      expect(results).toEqual({
        total: 1,
        deleted: 1,
        errors: 0,
      });
    });
  });
});
