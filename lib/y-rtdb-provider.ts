/**
 * RealtimeDatabaseProvider
 *
 * A lightweight, custom Yjs provider that synchronizes document state
 * via the Firebase Realtime Database (RTDB), using WebSocket-native
 * low-latency sync and automatic presence cleanup on disconnect.
 *
 * Architecture:
 * - /notebooks/{notebookId}/content/updates  → binary Yjs deltas (Base64)
 * - /notebooks/{notebookId}/awareness/{uid}  → cursor position & user info
 *
 * Cost: Billed per bandwidth (not per operation), making it ideal for
 * high-frequency real-time collaborative editing sessions.
 */

import * as Y from "yjs";
import {
  type Database,
  ref,
  push,
  onChildAdded,
  onValue,
  onDisconnect,
  set,
  remove,
  off,
  type DataSnapshot,
} from "firebase/database";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
  removeAwarenessStates,
} from "y-protocols/awareness";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface AwarenessUser {
  name: string;
  color: string;
  uid: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Converts a Uint8Array to a Base64 string for safe RTDB storage.
 * RTDB cannot store raw binary; Base64 is compact and safe.
 */
function uint8ToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string back to Uint8Array.
 */
function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    arr[i] = binary.charCodeAt(i);
  }
  return arr;
}

// ────────────────────────────────────────────────────────────────────────────
// Provider
// ────────────────────────────────────────────────────────────────────────────

export class RealtimeDatabaseProvider {
  private db: Database;
  private doc: Y.Doc;
  private notebookId: string;
  private uid: string;

  /**
   * A random ID unique to this page-load session.
   *
   * WHY: onChildAdded fires for ALL historical updates when the listener
   * first attaches (this is how we reconstruct state on reload). We need
   * to avoid echo-applying updates we push in the CURRENT session, but we
   * must NOT skip our own historical updates from past sessions.
   *
   * Using uid would incorrectly drop all of our own historical updates on
   * reload → user sees empty or partial content.
   * Using sessionId only drops echoes from the current tab's pushes.
   */
  private readonly sessionId: string = Math.random().toString(36).slice(2, 10);

  /** Yjs Awareness instance for cursor & presence sharing */
  readonly awareness: Awareness;

  /** Set of update keys already applied locally (prevents double-apply) */
  private appliedUpdates: Set<string> = new Set();

  /** Unsubscribe handles for RTDB listeners */
  private unsubContent?: () => void;
  private unsubAwareness?: () => void;

  private contentRef;
  private awarenessRef;
  private myAwarenessRef;

  constructor(db: Database, doc: Y.Doc, notebookId: string, uid: string) {
    this.db = db;
    this.doc = doc;
    this.notebookId = notebookId;
    this.uid = uid;

    this.awareness = new Awareness(doc);

    this.contentRef = ref(db, `notebooks/${notebookId}/content/updates`);
    this.awarenessRef = ref(db, `notebooks/${notebookId}/awareness`);
    this.myAwarenessRef = ref(db, `notebooks/${notebookId}/awareness/${uid}`);

    this._setupContentSync();
    this._setupAwarenessSync();
    this._setupDisconnectCleanup();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Content Synchronization
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Listens for local Yjs updates (user typing) and pushes them to RTDB.
   * Also listens for remote pushes from RTDB and applies them locally.
   *
   * onChildAdded delivers ALL existing children first (in push-key order,
   * which is chronological), then continues with new live updates. This is
   * how we reconstruct the full document state on page reload.
   */
  private _setupContentSync() {
    // 1. Local → RTDB: push binary delta when the local doc changes
    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      // Don't re-broadcast updates that came from the network
      if (origin === this) return;

      const base64 = uint8ToBase64(update);
      push(this.contentRef, {
        data: base64,
        uid: this.uid,
        // Tag with session ID so we can skip the echo below without
        // discarding our own HISTORICAL updates from previous sessions.
        sessionId: this.sessionId,
      });
    };

    this.doc.on("update", onDocUpdate);

    // 2. RTDB → Local: apply any new or historical deltas to the local Yjs doc
    const onRemoteUpdate = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) return;

      const key = snapshot.key;
      if (!key) return;

      // Prevent double-application (can happen during rapid re-renders)
      if (this.appliedUpdates.has(key)) return;
      this.appliedUpdates.add(key);

      const value = snapshot.val() as { data: string; uid: string; sessionId?: string };

      // Skip ONLY live echoes from the current session.
      // Historical updates (different sessionId) must be applied even if
      // they were originally created by the same uid — otherwise the document
      // will be empty or incomplete after a page reload.
      if (value.sessionId && value.sessionId === this.sessionId) return;

      try {
        const update = base64ToUint8(value.data);
        Y.applyUpdate(this.doc, update, this);
      } catch (err) {
        console.error("[y-rtdb] Failed to apply remote update:", err);
      }
    };

    const contentUnsub = onChildAdded(this.contentRef, onRemoteUpdate);

    this.unsubContent = () => {
      this.doc.off("update", onDocUpdate);
      off(this.contentRef, "child_added", onRemoteUpdate);
      contentUnsub();
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Awareness (Presence & Cursor Sync)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Publishes local awareness state (cursor position, user info) to RTDB.
   * Listens for remote awareness changes and applies them.
   *
   * Uses onValue (not onChildAdded) to immediately read the CURRENT presence
   * of all users already online — onChildAdded would miss them if they
   * joined before this listener was attached (e.g. on page reload).
   */
  private _setupAwarenessSync() {
    // 1. Local Awareness → RTDB: broadcast cursor/user info on change
    const onAwarenessChange = (
      { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
      origin: unknown
    ) => {
      if (origin === this) return;

      const changedClients = [...added, ...updated];
      if (changedClients.length === 0) return;

      const update = encodeAwarenessUpdate(this.awareness, changedClients);
      const base64 = uint8ToBase64(update);

      // Only write your own cursor state to your own awareness node
      if (changedClients.includes(this.doc.clientID)) {
        set(this.myAwarenessRef, { data: base64, clientID: this.doc.clientID });
      }

      // Handle explicit removals (e.g., tab close)
      if (removed.length > 0) {
        remove(this.myAwarenessRef);
      }
    };

    this.awareness.on("change", onAwarenessChange);

    // 2. RTDB Awareness → Local: read the current snapshot of ALL users' presence.
    //    onValue fires immediately with the current state, then on every change.
    //    This fixes the "caret missing after reload" bug where onChildAdded
    //    would miss users who were already online before this listener attached.
    const onRemoteAwareness = (snapshot: DataSnapshot) => {
      if (!snapshot.exists()) return;

      snapshot.forEach((childSnap) => {
        const value = childSnap.val() as { data: string; clientID: number } | null;
        if (!value) return;

        // Skip our own presence node
        if (value.clientID === this.doc.clientID) return;

        try {
          const update = base64ToUint8(value.data);
          applyAwarenessUpdate(this.awareness, update, this);
        } catch (err) {
          console.error("[y-rtdb] Failed to apply remote awareness:", err);
        }
      });
    };

    const awarenessUnsub = onValue(this.awarenessRef, onRemoteAwareness);

    this.unsubAwareness = () => {
      this.awareness.off("change", onAwarenessChange);
      awarenessUnsub();
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // onDisconnect Cleanup (Ghost Cursor Prevention)
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Registers a server-side cleanup rule that removes this user's presence
   * node the moment they lose network connectivity, even if they close the
   * tab without triggering a JS 'beforeunload' event.
   */
  private _setupDisconnectCleanup() {
    onDisconnect(this.myAwarenessRef).remove();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Sets the local user's visible info (name, color) in the Awareness state.
   * Should be called immediately after creating the provider.
   */
  setUser(user: AwarenessUser) {
    this.awareness.setLocalStateField("user", user);
  }

  /**
   * Destroys all listeners, cleans up awareness state and RTDB references.
   * Must be called in the useEffect cleanup function.
   */
  destroy() {
    // Remove own presence from awareness
    removeAwarenessStates(this.awareness, [this.doc.clientID], this);

    // Clean up RTDB presence node immediately
    remove(this.myAwarenessRef).catch(() => {});

    // Unsubscribe all RTDB listeners
    this.unsubContent?.();
    this.unsubAwareness?.();

    this.awareness.destroy();
    this.appliedUpdates.clear();
  }
}
