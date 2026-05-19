/**
 * RealtimeDatabaseProvider Unit Tests
 *
 * Validates the Yjs synchronization logic of the custom RTDB provider.
 * Uses a mocked Firebase database to avoid emulator requirements for unit tests.
 *
 * Run with:
 *   vitest run modules/notebook/__tests__/y-rtdb-provider.test.ts
 *
 * For full integration tests against the emulator, see rtdb-rules.test.ts.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import * as Y from "yjs";

// ─────────────────────────────────────────────────────────────────────────────
// Mock the firebase/database module before importing the provider
// ─────────────────────────────────────────────────────────────────────────────
const mockPush = vi.fn().mockResolvedValue({ key: "mock-key-1" });
const mockSet = vi.fn().mockResolvedValue(undefined);
const mockRemove = vi.fn().mockResolvedValue(undefined);
const mockOnChildAdded = vi.fn().mockReturnValue(() => {});
const mockOnValue = vi.fn().mockReturnValue(() => {});
const mockOff = vi.fn();
const mockOnDisconnect = vi.fn().mockReturnValue({ remove: vi.fn() });

vi.mock("firebase/database", () => ({
  ref: vi.fn((_db: unknown, path: string) => ({ path })),
  push: (...args: unknown[]) => mockPush(...args),
  set: (...args: unknown[]) => mockSet(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
  onChildAdded: (...args: unknown[]) => mockOnChildAdded(...args),
  onValue: (...args: unknown[]) => mockOnValue(...args),
  off: (...args: unknown[]) => mockOff(...args),
  onDisconnect: (...args: unknown[]) => mockOnDisconnect(...args),
}));


const mockAwarenessInstance = {
  on: vi.fn(),
  off: vi.fn(),
  setLocalStateField: vi.fn(),
  destroy: vi.fn(),
  doc: null,
  clientID: 999,
};

vi.mock("y-protocols/awareness", () => ({
  Awareness: vi.fn(function () {
    return mockAwarenessInstance;
  }),
  encodeAwarenessUpdate: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  applyAwarenessUpdate: vi.fn(),
  removeAwarenessStates: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Import the provider AFTER the mocks are set up
// ─────────────────────────────────────────────────────────────────────────────
import { RealtimeDatabaseProvider } from "@/lib/y-rtdb-provider";

const MOCK_DB = {} as ReturnType<typeof import("firebase/database").getDatabase>;
const NOTEBOOK_ID = "test-notebook-abc";
const USER_ID = "user-123";

describe("RealtimeDatabaseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnChildAdded.mockReturnValue(() => {});
    mockOnDisconnect.mockReturnValue({ remove: vi.fn() });
  });

  // ─────────────────────────────────────────────
  // 1. Initialization
  // ─────────────────────────────────────────────
  describe("Inicialização", () => {
    it("deve registrar o listener de onChildAdded (conteúdo) e onValue (awareness) ao inicializar", () => {
      const doc = new Y.Doc();
      new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      // Content sync uses onChildAdded (delivers history + live updates)
      expect(mockOnChildAdded).toHaveBeenCalledTimes(1);
      // Awareness sync uses onValue (reads current presence snapshot immediately)
      expect(mockOnValue).toHaveBeenCalledTimes(1);

      doc.destroy();
    });

    it("deve registrar onDisconnect para limpeza automática de presença", () => {
      const doc = new Y.Doc();
      new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      expect(mockOnDisconnect).toHaveBeenCalledOnce();
      expect(mockOnDisconnect().remove).toBeDefined();
      doc.destroy();
    });

    it("deve publicar dados de presença ao chamar setUser()", () => {
      const doc = new Y.Doc();
      const provider = new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      provider.setUser({ name: "João", color: "#FF0000", uid: USER_ID });

      expect(provider.awareness.setLocalStateField).toHaveBeenCalledWith("user", {
        name: "João",
        color: "#FF0000",
        uid: USER_ID,
      });

      doc.destroy();
    });
  });

  // ─────────────────────────────────────────────
  // 2. Local → RTDB: update propagation
  // ─────────────────────────────────────────────
  describe("Sincronização local → RTDB", () => {
    it("deve chamar push() no RTDB ao atualizar o Yjs Doc localmente", () => {
      const doc = new Y.Doc();
      new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      // Trigger a Yjs update by inserting text
      const text = doc.getText("content");
      text.insert(0, "Olá!");

      // The update handler should have pushed to RTDB
      expect(mockPush).toHaveBeenCalledOnce();
      const [, payload] = (mockPush as Mock).mock.calls[0];
      expect(payload).toHaveProperty("data");
      expect(payload).toHaveProperty("uid", USER_ID);
      // Should include sessionId to enable correct echo prevention
      expect(payload).toHaveProperty("sessionId");
      expect(typeof payload.sessionId).toBe("string");

      doc.destroy();
    });

    it("não deve chamar push() para updates com origin === provider (evita echo)", () => {
      const doc = new Y.Doc();
      const provider = new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      // Simulate a remote update applied with provider as origin (echo scenario)
      const remoteUpdate = Y.encodeStateAsUpdate(doc);
      Y.applyUpdate(doc, remoteUpdate, provider);

      // push should NOT be called because origin === provider
      expect(mockPush).not.toHaveBeenCalled();

      doc.destroy();
    });
  });

  // ─────────────────────────────────────────────
  // 3. Destruction / cleanup
  // ─────────────────────────────────────────────
  describe("Destruição e limpeza", () => {
    it("deve chamar remove() para limpar a presença ao destruir o provider", () => {
      const doc = new Y.Doc();
      const provider = new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      provider.destroy();

      expect(mockRemove).toHaveBeenCalledOnce();
      doc.destroy();
    });

    it("deve desregistrar listeners ao destruir o provider", () => {
      const doc = new Y.Doc();
      const provider = new RealtimeDatabaseProvider(MOCK_DB, doc, NOTEBOOK_ID, USER_ID);

      provider.destroy();

      // off() should have been called for both content and awareness listeners
      expect(mockOff).toHaveBeenCalled();
      doc.destroy();
    });
  });
});
