"use server";

import { protectedAction } from "@/lib/safe-action";
import { callService } from "./call.service";
import {
  startCallSchema,
  endCallSchema,
  generateStreamTokenSchema,
  leaveCallSchema,
} from "./call.schema";

/**
 * startCallAction — Teacher initiates a call from the notebook.
 *
 * Returns CallState ({ callId, streamToken, apiKey }) which the client
 * uses to initialize the StreamVideoClient. No secrets exposed.
 *
 * RBAC: only teachers (and admins) can start calls.
 */
export const startCallAction = protectedAction
  .schema(startCallSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    if (user.role !== "teacher" && user.role !== "admin") {
      throw new Error("Only teachers can start calls");
    }

    const callState = await callService.startCall(
      user.id,
      parsedInput.studentId,
      parsedInput.notebookId
    );

    return { callState };
  });

/**
 * endCallAction — Teacher ends the call for ALL participants.
 *
 * This writes callId: null to the student's Firestore doc, which
 * triggers the student's onSnapshot listener to unmount the call UI.
 */
export const endCallAction = protectedAction
  .schema(endCallSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    // Teacher ends call for everyone; admin can also do it
    if (user.role !== "teacher" && user.role !== "admin") {
      throw new Error("Only teachers can end calls");
    }

    await callService.endCall(
      parsedInput.callId,
      parsedInput.studentId,
      parsedInput.notebookId
    );

    return { success: true };
  });

/**
 * leaveCallAction — Student leaves the call voluntarily.
 *
 * Does NOT end the call for the teacher. Only clears the student's
 * own Firestore callId so they stop receiving the call signal.
 */
export const leaveCallAction = protectedAction
  .schema(leaveCallSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    if (user.role !== "student") {
      throw new Error("Only students can leave calls (teachers use endCall)");
    }

    await callService.studentLeaveCall(parsedInput.studentId);

    return { success: true };
  });

/**
 * generateStreamTokenAction — Generates a Stream JWT token for a user.
 *
 * Called by the student when the Firestore listener fires and they need
 * to join the call. Token generation is always server-side to keep
 * STREAM_SECRET private.
 */
export const generateStreamTokenAction = protectedAction
  .schema(generateStreamTokenSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user } = ctx;

    // Security: a user can only generate their own token
    if (user.id !== parsedInput.userId) {
      throw new Error("Cannot generate a token for another user");
    }

    const { env } = await import("@/env");
    const token = await callService.generateStreamToken(parsedInput.userId);

    return {
      token,
      apiKey: env.NEXT_PUBLIC_STREAM_API_KEY,
    };
  });
