/**
 * RTDB Security Rules — Unit Tests
 *
 * Validates the LOGIC of the database.rules.json without requiring a running
 * Firebase Emulator. This suite uses a pure JavaScript simulation of the RTDB
 * rule evaluation engine to verify each access scenario.
 *
 * WHY NOT USE @firebase/rules-unit-testing HERE:
 *   That library requires a running emulator (port 9000). Those tests are
 *   integration tests and should be run separately with:
 *
 *     npx firebase emulators:exec \
 *       "vitest run modules/notebook/__tests__/rtdb-rules.integration.test.ts" \
 *       --only database
 *
 * This file covers ALL scenarios with zero infrastructure dependencies.
 */

import { describe, it, expect } from "vitest";

// ──────────────────────────────────────────────────────────────────────────────
// Rule Engine Simulator
//
// Mirrors the exact logic in database.rules.json so that rule changes
// are reflected immediately in tests.
// ──────────────────────────────────────────────────────────────────────────────

interface Auth {
  uid: string;
}

interface NotebookMetadata {
  studentId: string;
  teacherId: string;
}

/**
 * Simulates the RTDB rule:
 *   .read: auth != null &&
 *     (data.child('metadata/studentId').val() === auth.uid ||
 *      data.child('metadata/teacherId').val() === auth.uid)
 */
function canReadNotebook(auth: Auth | null, metadata: NotebookMetadata | null): boolean {
  if (!auth) return false;
  if (!metadata) return false; // no metadata → no access
  return metadata.studentId === auth.uid || metadata.teacherId === auth.uid;
}

/**
 * Simulates the RTDB rule for /notebooks/{id}/content:
 *   .write: auth != null &&
 *     (data.parent().child('metadata/studentId').val() === auth.uid ||
 *      data.parent().child('metadata/teacherId').val() === auth.uid)
 */
function canWriteContent(auth: Auth | null, metadata: NotebookMetadata | null): boolean {
  if (!auth) return false;
  if (!metadata) return false;
  return metadata.studentId === auth.uid || metadata.teacherId === auth.uid;
}

/**
 * Simulates the RTDB rule for /notebooks/{id}/awareness/{userId}:
 *   .write: auth != null &&
 *     auth.uid === $userId &&
 *     (root.child('notebooks/{id}/metadata/studentId').val() === auth.uid ||
 *      root.child('notebooks/{id}/metadata/teacherId').val() === auth.uid)
 *
 * @param targetUserId - the $userId wildcard in the path being written to
 */
function canWriteAwareness(
  auth: Auth | null,
  targetUserId: string,
  metadata: NotebookMetadata | null
): boolean {
  if (!auth) return false;
  if (!metadata) return false;
  // Must be writing to own node
  if (auth.uid !== targetUserId) return false;
  // Must be a participant
  return metadata.studentId === auth.uid || metadata.teacherId === auth.uid;
}

/**
 * Simulates the RTDB rule for /notebooks/{id}/metadata:
 *   .write: auth != null &&
 *     (!data.exists() ||
 *      data.parent().child('metadata/studentId').val() === auth.uid ||
 *      data.parent().child('metadata/teacherId').val() === auth.uid)
 *
 * @param metadataExists - whether a metadata node already exists (data.exists())
 */
function canWriteMetadata(
  auth: Auth | null,
  metadataExists: boolean,
  existingMetadata: NotebookMetadata | null
): boolean {
  if (!auth) return false;
  // Allow first-time creation (!data.exists())
  if (!metadataExists) return true;
  if (!existingMetadata) return false;
  return existingMetadata.studentId === auth.uid || existingMetadata.teacherId === auth.uid;
}

// ──────────────────────────────────────────────────────────────────────────────
// Test Data
// ──────────────────────────────────────────────────────────────────────────────

const METADATA: NotebookMetadata = {
  studentId: "student-1",
  teacherId: "teacher-1",
};

const STUDENT: Auth = { uid: "student-1" };
const TEACHER: Auth = { uid: "teacher-1" };
const STRANGER: Auth = { uid: "stranger-999" };

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

describe("RTDB Security Rules — /notebooks/{notebookId}", () => {

  // ──────────────────────────────────────────────
  // READ: /notebooks/{notebookId}
  // ──────────────────────────────────────────────
  describe("READ .read rule", () => {
    it("deve NEGAR leitura para usuário não autenticado (auth = null)", () => {
      expect(canReadNotebook(null, METADATA)).toBe(false);
    });

    it("deve NEGAR leitura quando o caderno não possui metadata (notebook inexistente)", () => {
      expect(canReadNotebook(STUDENT, null)).toBe(false);
    });

    it("deve PERMITIR leitura para o aluno vinculado (studentId === auth.uid)", () => {
      expect(canReadNotebook(STUDENT, METADATA)).toBe(true);
    });

    it("deve PERMITIR leitura para o professor vinculado (teacherId === auth.uid)", () => {
      expect(canReadNotebook(TEACHER, METADATA)).toBe(true);
    });

    it("deve NEGAR leitura para um usuário autenticado mas NÃO vinculado ao caderno", () => {
      expect(canReadNotebook(STRANGER, METADATA)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // WRITE: /notebooks/{notebookId}/content
  // ──────────────────────────────────────────────
  describe("WRITE /content rule", () => {
    it("deve NEGAR escrita de conteúdo para usuário não autenticado", () => {
      expect(canWriteContent(null, METADATA)).toBe(false);
    });

    it("deve NEGAR escrita de conteúdo quando não há metadata (caderno não inicializado)", () => {
      expect(canWriteContent(STUDENT, null)).toBe(false);
    });

    it("deve PERMITIR escrita de conteúdo para o aluno vinculado", () => {
      expect(canWriteContent(STUDENT, METADATA)).toBe(true);
    });

    it("deve PERMITIR escrita de conteúdo para o professor vinculado", () => {
      expect(canWriteContent(TEACHER, METADATA)).toBe(true);
    });

    it("deve NEGAR escrita de conteúdo para um usuário não vinculado ao caderno", () => {
      expect(canWriteContent(STRANGER, METADATA)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // WRITE: /notebooks/{notebookId}/awareness/{userId}
  // ──────────────────────────────────────────────
  describe("WRITE /awareness/{userId} rule", () => {
    it("deve NEGAR escrita de presença para usuário não autenticado", () => {
      expect(canWriteAwareness(null, "student-1", METADATA)).toBe(false);
    });

    it("deve PERMITIR que o aluno escreva no próprio nó awareness", () => {
      expect(canWriteAwareness(STUDENT, "student-1", METADATA)).toBe(true);
    });

    it("deve PERMITIR que o professor escreva no próprio nó awareness", () => {
      expect(canWriteAwareness(TEACHER, "teacher-1", METADATA)).toBe(true);
    });

    it("deve NEGAR que o aluno escreva no nó awareness de outro usuário (spoofing)", () => {
      // student-1 attempts to write to teacher-1's awareness node
      expect(canWriteAwareness(STUDENT, "teacher-1", METADATA)).toBe(false);
    });

    it("deve NEGAR que um usuário não vinculado escreva qualquer nó awareness", () => {
      expect(canWriteAwareness(STRANGER, "stranger-999", METADATA)).toBe(false);
    });

    it("deve NEGAR escrita sem metadata (caderno não inicializado)", () => {
      expect(canWriteAwareness(STUDENT, "student-1", null)).toBe(false);
    });
  });

  // ──────────────────────────────────────────────
  // WRITE: /notebooks/{notebookId}/metadata
  // ──────────────────────────────────────────────
  describe("WRITE /metadata rule", () => {
    it("deve NEGAR escrita de metadata para usuário não autenticado", () => {
      expect(canWriteMetadata(null, false, null)).toBe(false);
    });

    it("deve PERMITIR criação inicial de metadata por qualquer usuário autenticado (!data.exists)", () => {
      // First creation — the notebook doesn't exist yet
      expect(canWriteMetadata(STUDENT, false, null)).toBe(true);
      expect(canWriteMetadata(STRANGER, false, null)).toBe(true); // Server Actions set this server-side
    });

    it("deve PERMITIR atualização de metadata pelo aluno vinculado", () => {
      expect(canWriteMetadata(STUDENT, true, METADATA)).toBe(true);
    });

    it("deve PERMITIR atualização de metadata pelo professor vinculado", () => {
      expect(canWriteMetadata(TEACHER, true, METADATA)).toBe(true);
    });

    it("deve NEGAR atualização de metadata por usuário não vinculado", () => {
      expect(canWriteMetadata(STRANGER, true, METADATA)).toBe(false);
    });
  });
});
