import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { aiService } from "@/modules/ai/ai.service";
import { CEFRLevel } from "@/modules/curriculum/curriculum.types";

/**
 * SSE endpoint for streaming AI operations during curriculum creation.
 * 
 * Usage: GET /api/curriculum/stream?lessonId=xxx&step=2|3|5
 * 
 * The client connects via EventSource and receives chunks as they arrive
 * from Gemini's generateContentStream.
 */
export async function GET(request: NextRequest) {
  // 1. Auth check
  const user = await getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "manager")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Parse params
  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get("lessonId");
  const step = searchParams.get("step");

  if (!lessonId || !step) {
    return new Response("Missing lessonId or step", { status: 400 });
  }

  // 3. Fetch lesson
  const lesson = await curriculumRepository.findLessonById(lessonId);
  if (!lesson) {
    return new Response("Lesson not found", { status: 404 });
  }

  // 4. Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        sendEvent("status", "started");

        if (step === "2") {
          // Step 2: Stream Transcription
          if (!lesson.mediaId) {
            sendEvent("error", "No media attached");
            controller.close();
            return;
          }
          const media = lesson.media;
          if (!media?.url) {
            sendEvent("error", "Media URL not found");
            controller.close();
            return;
          }

          const result = await aiService.streamTranscription(
            media.url,
            "video",
            (chunk) => sendEvent("chunk", chunk),
            user.id
          );

          sendEvent("result", JSON.stringify(result));

        } else if (step === "3") {
          // Step 3: Stream Analysis
          if (!lesson.contentText) {
            sendEvent("error", "No content text available");
            controller.close();
            return;
          }

          const result = await aiService.streamAnalysis(
            lesson.contentText,
            lesson.difficulty as CEFRLevel,
            (chunk) => sendEvent("chunk", chunk),
            user.id
          );

          sendEvent("result", JSON.stringify(result));

        } else if (step === "5") {
          // Step 5: Stream Enrichment (requires items in query or body — simplified here)
          sendEvent("status", "Enrichment streaming requires items payload. Use POST endpoint instead.");
        } else {
          sendEvent("error", `Unsupported step: ${step}`);
        }

        sendEvent("status", "completed");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown streaming error";
        sendEvent("error", message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
