import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { curriculumRepository } from "@/modules/curriculum/curriculum.repository";
import { aiService } from "@/modules/ai/ai.service";
import { CEFRLevel, AnalysisResult, Segment } from "@/modules/curriculum/curriculum.types";

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

          const mediaType = media.url.match(/\.(mp3|wav|m4a|aac|ogg)$/) ? "audio" : "video";

          const result = await aiService.transcribeMedia(
            media.url,
            mediaType,
            (chunk: string) => sendEvent("chunk", chunk),
            user.id
          );

          // Persist transcription
          await curriculumRepository.updateMedia(media.id, {
            transcriptionText: result.full_text,
            transcriptionTimestamps: result.segments,
            status: "pending_review"
          });

          sendEvent("result", JSON.stringify(result));

        } else if (step === "4") {
          // Step 4: Stream Analysis from Transcription
          const transcription = lesson.media?.transcriptionText;
          if (!transcription) {
            sendEvent("error", "No transcription available for analysis");
            controller.close();
            return;
          }

          const result = await aiService.parseLessonContent(
            transcription,
            lesson.difficulty as CEFRLevel,
            lesson.language!.name,
            lesson.nativeLanguage!.name,
            (chunk: string) => sendEvent("chunk", chunk),
            user.id
          );

          // 3. Save results and update status
          await curriculumRepository.updateLesson(lesson.id, {
            analysisResultJson: result,
            status: "reviewing",
            creationStep: 5
          });

          sendEvent("result", JSON.stringify(result));

        } else if (step === "6") {
          // Step 6: Pedagogical Quality Analysis of lesson content
          if (!lesson.contentText) {
            sendEvent("error", "No lesson content available for quality analysis");
            controller.close();
            return;
          }

          const result = await aiService.streamQualityAnalysis(
            lesson.contentText,
            lesson.difficulty as CEFRLevel,
            (chunk) => sendEvent("chunk", chunk),
            lesson.nativeLanguage!.name,
            user.id
          );

          await curriculumRepository.updateLesson(lesson.id, {
            qualityAnalysisJson: result,
            creationStep: 7,
          });

          sendEvent("result", JSON.stringify(result));

        } else if (step === "7") {
          // Step 7: Extract learning items from lesson content + merge with transcription items
          // OPTIMIZATION: If content hasn't changed from transcription, skip re-analysis
          const isIdentical = lesson.contentText?.trim() === lesson.media?.transcriptionText?.trim();
          
          if (isIdentical && lesson.analysisResultJson) {
            console.log(`[SSE] Step 7: Content identical to transcription. Skipping AI.`);
            sendEvent("status", "completed");
            sendEvent("result", JSON.stringify(lesson.analysisResultJson));
            
            // Still update creation step to move forward
            await curriculumRepository.updateLesson(lesson.id, {
              creationStep: 8,
            });
            return;
          }

          // Extract vocab/structures from the lesson content
          const lessonAnalysis = await aiService.parseLessonContent(
            lesson.contentText!,
            lesson.difficulty as CEFRLevel,
            lesson.language!.code,
            lesson.nativeLanguage!.code,
            (chunk: string) => sendEvent("chunk", chunk),
            user.id
          );

          // Merge with transcription analysis (from step 4), deduplicating by lemma
          const transcriptionAnalysis = lesson.analysisResultJson as AnalysisResult | null;

          const mergedVocabulary = aiService.mergeAndDeduplicateItems(
            transcriptionAnalysis?.vocabulary ?? [],
            lessonAnalysis.vocabulary ?? []
          );

          const mergedStructures = aiService.mergeAndDeduplicateStructures(
            transcriptionAnalysis?.structures ?? [],
            lessonAnalysis.structures ?? []
          );

          const mergedResult = { vocabulary: mergedVocabulary, structures: mergedStructures };

          await curriculumRepository.updateLesson(lesson.id, {
            analysisResultJson: mergedResult,
            creationStep: 8,
          });

          sendEvent("result", JSON.stringify(mergedResult));

        } else if (step === "9") {
          // Step 9: Generate Quiz based on lesson content and items (prioritizing CORE)
          if (!lesson.contentText) {
            sendEvent("error", "No lesson content available for quiz generation");
            controller.close();
            return;
          }

          // Fetch items linked to this lesson to filter by priority if needed
          const lessonItems = await curriculumRepository.findLessonItems(lessonId);
          
          const result = await aiService.generateQuiz({
            contentText: lesson.contentText,
            level: lesson.difficulty as CEFRLevel,
            items: lessonItems,
            targetLanguage: lesson.language!.name,
            nativeLanguage: lesson.nativeLanguage!.name,
            onChunk: (chunk: string) => sendEvent("chunk", chunk),
            transcriptionSegments: (lesson.media?.config as { segments?: Segment[] } | null)?.segments || lesson.media?.transcriptionTimestamps || [],
            userId: user.id
          });

          await curriculumRepository.updateLesson(lesson.id, {
            quizData: result,
            creationStep: 10,
          });

          sendEvent("result", JSON.stringify(result));

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
