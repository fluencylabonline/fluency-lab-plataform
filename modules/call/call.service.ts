import { StreamClient } from "@stream-io/node-sdk";
import type { CallState } from "./call.types";
import { env } from "@/env";
import { callRepository } from "./call.repository";

/**
 * call.service.ts — Business logic for video calls.
 */

async function startCall(
  teacherId: string,
  studentId: string,
  notebookId: string
): Promise<CallState> {
  const { adminDb } = await import("@/lib/firebase-admin");

  // Unique session ID
  const streamCallId = `call_${studentId}_${Date.now()}`;

  // Save callId on the student's Firestore doc so the real-time listener fires
  await adminDb.collection("users").doc(studentId).set(
    { callId: streamCallId, notebookId },
    { merge: true }
  );

  // Record session start in Neon
  await callRepository.create({
    streamCallId,
    studentId,
    teacherId,
    notebookId,
    startedAt: new Date(),
    transcriptionStatus: "pending",
  });

  const streamToken = await generateStreamToken(teacherId);

  return {
    callId: streamCallId,
    streamToken,
    apiKey: env.NEXT_PUBLIC_STREAM_API_KEY,
  };
}

async function endCall(
  callId: string,
  studentId: string,
  notebookId?: string
): Promise<void> {
  const { adminDb } = await import("@/lib/firebase-admin");

  // 1. Clear Firestore (triggers UI close for student)
  await adminDb.collection("users").doc(studentId).set(
    { callId: null, notebookId: null },
    { merge: true }
  );

  // 2. Update session in Neon
  const session = await callRepository.findByStreamId(callId);
  if (session) {
    const endedAt = new Date();
    const durationSeconds = Math.floor(
      (endedAt.getTime() - session.startedAt.getTime()) / 1000
    );

    await callRepository.update(callId, {
      endedAt,
      durationSeconds,
    });
  }

  if (notebookId) {
    console.log(`[callService] Call ${callId} ended on notebook ${notebookId}`);
  }
}

async function studentLeaveCall(studentId: string): Promise<void> {
  const { adminDb } = await import("@/lib/firebase-admin");

  await adminDb.collection("users").doc(studentId).set(
    { callId: null, notebookId: null },
    { merge: true }
  );
}

async function generateStreamToken(userId: string): Promise<string> {
  const client = new StreamClient(env.NEXT_PUBLIC_STREAM_API_KEY, env.STREAM_SECRET);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  const token = client.generateUserToken({
    user_id: userId,
    exp: expirationTime,
    iat: issuedAt,
  });

  return token;
}

/**
 * Handle incoming transcription from Stream Webhook.
 */
async function handleTranscriptionWebhook(streamCallId: string, transcriptionUrl: string) {
  // Fetch transcription text from the provided URL
  try {
    const response = await fetch(transcriptionUrl);
    const transcription = await response.text();

    await callRepository.update(streamCallId, {
      transcription,
      transcriptionStatus: "available",
    });
  } catch (error) {
    console.error("[callService] Error fetching transcription:", error);
    await callRepository.update(streamCallId, {
      transcriptionStatus: "failed",
    });
  }
}

/**
 * Retrieve call history for a student.
 */
async function getStudentCallHistory(studentId: string) {
  return callRepository.listByStudent(studentId);
}

export const callService = {
  startCall,
  endCall,
  studentLeaveCall,
  generateStreamToken,
  handleTranscriptionWebhook,
  getStudentCallHistory,
  getCallByStreamId: async (streamCallId: string) => callRepository.findByStreamId(streamCallId),
};
