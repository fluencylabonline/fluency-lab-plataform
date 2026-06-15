import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { env } from "@/env";
import { QuizData, CEFRLevel, QuizItem, AnalysisResult, LearningItemMetadata } from "@/modules/curriculum/curriculum.types";
import type { QuizData as NotebookQuizData } from "@/components/tiptap-extension/quiz/quiz.types";
import { checkRateLimit, checkDailyBudget } from "@/lib/rate-limit";
import { aiRepository } from "./ai.repository";
import { generateHash, approximateTokens, truncateByTokens } from "./ai.utils";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

const MODELS = {
  fast: "gemini-2.5-flash",
  pro: process.env.TRANSCRIPTION_MODEL || "gemini-2.5-pro",
  embedding: "gemini-embedding-2-preview",
  media: "gemini-2.5-pro",
};

export interface PlacementAIQuestion {
  learningItemId?: string;
  content: string;
  context?: string;
  audio_script?: string;
  options: { id: string; text: string }[];
  correct_option_id: string;
}

const getStructureTaxonomy = (language: string) => `
STRUCTURES (USE THESE CODES IN "type"):
- A1: "s-v", "s-v-o", "s-v-p-o", "s-av", "s-v-adv"
- A2: "s-v-do-io", "s-v-o-o", "s-av-v-o", "s-v-inf", "s-v-ing"
- B1: "s-v-o-adv", "s-v-o-p-o", "s-v-that-s-v-o", "s-v-wh"
- B2: "passive-s-v-o", "s-modal-v-o", "s-v-o-to-v", "s-v-o-ing"
- C1: "conditional-zero", "conditional-first", "conditional-second", "conditional-third", "relative-clause-def", "relative-clause-nondef", "s-v-o-which-s-v"
- C2: "mixed-conditional", "passive-perfect", "cleft-sentence", "inversion-negative", "s-v-o-participle"
(Provide explanations in ${language})
`;

const getEnrichFormatRules = (nativeLanguage: string) => `
REGRAS DE FORMATO POR TIPO:
1. Se o item for VOCABULARY (noun, verb, adjective, etc):
{
  "type": "noun/verb/...",
  "level": "A1-C2",
  "phonetic": "/.../",
  "translation": "tradução principal para ${nativeLanguage}",
  "is_visual": boolean,
  "key_image_words": "keywords for unsplash",
  "meanings": [{ "definition": "em ${nativeLanguage}", "translation": "em ${nativeLanguage}" }],
  "forms": { "base": "...", "past": "...", "participle": "...", "plural": "..." },
  "examples": [{ "text": "no idioma alvo", "translation": "em ${nativeLanguage}" }],
  "synonyms": ["no idioma alvo"]
}

2. Se o item for STRUCTURE (ex: gramática, padrões de frase):
{
  "level": "A1-C2",
  "structure_type": "Nome pedagógico (ex: Passive Voice, Mixed Conditional)",
  "syntactic_pattern": "SVO/SV/SVC/SVOO/etc",
  "translation": "nome da estrutura em ${nativeLanguage}",
  "explanation": "explicação didática clara em ${nativeLanguage}",
  "examples": [{ 
    "text": "no idioma alvo", 
    "translation": "em ${nativeLanguage}", 
    "word_order": [{ "word": "...", "index": 0, "role": "subject/verb/object/etc" }] 
  }]
}
`;

const getQualityAnalysisCriteria = (language: string) => `
1. Objective (2-3 min): Connection with reality and the "why" of learning.
2. Vocabulary and Grammar (15-20 min): Contextualization, practical examples, and linguistic contrast.
3. Contextualization (5-10 min): Use of mini-texts or dialogues.
4. Guided Practice (20-30 min): Scaffolding exercises.
5. Free Conversation (15-20 min): Autonomous oral production.
6. Consolidation (5 min): Technical review and checklist.
(All feedback must be in ${language})`;

/**
 * Robustly cleans a JSON string that might be wrapped in markdown blocks
 * or contain leading/trailing whitespace/text.
 */
function cleanJsonString(str: string): string {
  // Remove markdown code blocks if present
  const markdownMatch = str.match(/```(?:json)?([\s\S]*?)```/);
  const content = (markdownMatch ? markdownMatch[1] : str).trim();

  // Find first occurrence of { or [
  const start = content.search(/[\[\{]/);
  if (start === -1) return content;

  const startChar = content[start];
  const endChar = startChar === "{" ? "}" : "]";
  const lastIndex = content.lastIndexOf(endChar);

  if (lastIndex === -1) return content.substring(start);

  return content.substring(start, lastIndex + 1);
}

export const aiService = {
  /**
   * Generates embeddings for a given text using text-embedding-004.
   * Returns a 768-dimension vector.
   */
  async getEmbeddings(text: string, userId?: string): Promise<number[]> {
    const hash = generateHash(text);
    const cached = await aiRepository.getCache(hash, "gemini_embedding");
    if (cached) return cached as number[];

    if (userId) {
      const limit = await checkRateLimit("gemini_embedding", userId, 200);
      if (!limit.success) throw new Error("Rate limit exceeded for AI embeddings");
    }
    const model = genAI.getGenerativeModel({ model: `models/${MODELS.embedding}` });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    // Cache results for 90 days for embeddings
    await aiRepository.setCache(hash, "gemini_embedding", embedding, 90);
    return embedding;
  },

  /**
   * Generates a qualitative pedagogical summary based on the student survey responses.
   * This summary is used to generate the embedding for RAG.
   */
  async generateStudentProfileSummary(responses: Record<string, unknown>, nativeLanguage: string, userId?: string): Promise<string> {
    const hash = generateHash({ responses, nativeLanguage });
    const cached = await aiRepository.getCache(hash, "gemini_summary");
    if (cached) return cached as string;

    if (userId) {
      const limit = await checkRateLimit("gemini_summary", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI summary");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
    });

    const prompt = `Act as a Pedagogical Specialist and Instructional Designer.
    Analyze the student's onboarding questionnaire responses and generate a detailed qualitative summary (Pedagogical Profile) in ${nativeLanguage.toUpperCase()}.
    
    This summary must capture:
    1. Professional Profile and Interests: How the student uses the language and what motivates them.
    2. Level and Background: Where they are now and their previous experience.
    3. Goals and Timelines: What they want to achieve and in what timeframe.
    4. Learning Style and Preferences: How they prefer to learn and what kind of feedback they expect.
    5. Challenges and Blocks: What prevents them from advancing (e.g., speaking anxiety).
    
    The summary should be written in a narrative and technical manner, focused on helping the AI select the best lessons for them.
    
    STUDENT RESPONSES:
    ${JSON.stringify(responses, null, 2)}
    
    Qualitative Summary:`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    await aiRepository.setCache(hash, "gemini_summary", summary, 30);
    return summary;
  },

  /**
   * Generates a structural sequence for a learning plan.
   * Decides between existing lessons and suggestions for new content.
   */
  async generatePersonalizedPlanStructure(
    params: {
      profileSummary: string;
      currentLevel: string;
      availableLessons: Array<{ id: string; title: string; difficulty: string }>;
      allowSuggestions: boolean;
      targetLanguage: string;
      nativeLanguage: string;
    },
    userId?: string
  ) {
    const hash = generateHash(params);
    const cached = await aiRepository.getCache(hash, "gemini_plan_gen");
    if (cached) return cached;

    if (userId) {
      const limit = await checkRateLimit("gemini_plan_gen", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI plan generation");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            planName: { type: SchemaType.STRING },
            slots: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING, format: "enum", enum: ["existing", "suggestion"] },
                  lessonId: { type: SchemaType.STRING }, // Used if type is 'existing'
                  suggestion: {
                    type: SchemaType.OBJECT,
                    properties: {
                      title: { type: SchemaType.STRING },
                      description: { type: SchemaType.STRING },
                      objective: { type: SchemaType.STRING }
                    },
                    required: ["title", "description", "objective"]
                  }
                },
                required: ["type"]
              }
            }
          },
          required: ["planName", "slots"]
        }
      }
    });

    const prompt = `Act as a Pedagogical Director of an elite language school.
    Your goal is to create a personalized 24-LESSON Study Plan for this student to learn ${params.targetLanguage}.
    
    STUDENT PROFILE:
    "${params.profileSummary}"
    CURRENT LEVEL: ${params.currentLevel}
    NATIVE LANGUAGE: ${params.nativeLanguage}
    
    AVAILABLE LESSONS IN BANK:
    ${JSON.stringify(params.availableLessons, null, 2)}
    
    INSTRUCTIONS:
    1. Create a logical sequence of EXACTLY 24 lessons that takes the student from their current level to the next goal.
    2. If an available lesson in the bank is an excellent match for the profile and level, use it (type: "existing").
    3. If there is NO ideal lesson in the bank for a specific step needed in the journey:
       - If allowSuggestions is TRUE: Create a lesson SUGGESTION (type: "suggestion") with title, description, and objective.
       - If allowSuggestions is FALSE: Try to adapt the closest available lesson.
    4. The plan must be balanced between professional interests and necessary grammar for the level.
    5. The plan name and suggestions must be in ${params.nativeLanguage}.
    
    Allow Suggestions: ${params.allowSuggestions ? "YES" : "NO"}
    
    Retorne o JSON conforme o esquema definido com exatamente 24 slots.`;

    const result = await model.generateContent(prompt);
    const plan = JSON.parse(result.response.text());

    await aiRepository.setCache(hash, "gemini_plan_gen", plan, 7);
    return plan;
  },

  /**
   * Step 3: Parser Semântico. 
   * Extrair vocabulário e estruturas sugeridas de um texto.
   */

  async parseLessonContent(
    text: string,
    level: CEFRLevel,
    targetLanguage: string,
    nativeLanguage: string,
    onChunkOrUserId?: ((chunk: string) => void) | string,
    userId?: string
  ): Promise<AnalysisResult> {
    const onChunk = typeof onChunkOrUserId === "function" ? onChunkOrUserId : undefined;
    const resolvedUserId = typeof onChunkOrUserId === "string" ? onChunkOrUserId : userId;

    const hash = generateHash({ text, level, targetLanguage, nativeLanguage });
    const cached = await aiRepository.getCache(hash, "gemini_parse");
    if (cached) {
      if (onChunk) onChunk(JSON.stringify(cached));
      return cached as AnalysisResult;
    }

    if (resolvedUserId) {
      const limit = await checkRateLimit("gemini_parse", resolvedUserId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI parsing");
    }
    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            vocabulary: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  lemma: { type: SchemaType.STRING },
                  type: { type: SchemaType.STRING, format: "enum", enum: ["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "pronoun", "determiner", "particle"] },
                  contextual_meaning: { type: SchemaType.STRING },
                },
                required: ["lemma", "type", "contextual_meaning"]
              }
            },
            structures: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING }, // Should be codes like 's-v-o', 'passive-s-v-o', etc.
                  name: { type: SchemaType.STRING },
                  example_from_text: { type: SchemaType.STRING },
                },
                required: ["type", "name", "example_from_text"]
              }
            }
          },
          required: ["vocabulary", "structures"]
        }
      }
    });

    const safeText = truncateByTokens(text, 8000); // Max ~8k tokens for parsing safely
    const tokens = approximateTokens(safeText);
    console.log(`[aiService.parseLessonContent] Input tokens: ${tokens}`);

    const prompt = `Analyze the following text at level ${level} for teaching ${targetLanguage}. 
    The student speaks ${nativeLanguage}.
    1. Extract the most relevant vocabulary (lemmatized) and classify it (noun, verb, etc.). Provide the "contextual_meaning" in ${nativeLanguage}.
    2. Identify the main grammatical structures and map them to the official structure codes below.
    
    ${getStructureTaxonomy(nativeLanguage)}
    
    Important: In the structure "type" field, use EXCLUSIVELY one of the codes above.
    
    Text: "${safeText}"`;

    let finalResult: AnalysisResult;
    if (onChunk) {
      const result = await model.generateContentStream(prompt);
      let fullText = "";
      for await (const chunk of result.stream) {
        const t = chunk.text();
        fullText += t;
        onChunk(t);
      }
      finalResult = JSON.parse(fullText);
    } else {
      const result = await model.generateContent(prompt);
      finalResult = JSON.parse(result.response.text());
    }

    await aiRepository.setCache(hash, "gemini_parse", finalResult, 60);
    return finalResult;
  },

  /**
   * Step 5: Enriquecimento de Dados em Lote (Batch Enrichment).
   * Gera metadados detalhados para múltiplos itens de vocabulário ou estrutura em uma única chamada.
   */

  async enrichBatchLearningItems(
    items: Array<{ lemma: string; type: string; context: string }>,
    targetLanguage: string,
    nativeLanguage: string,
    translationInstruction: string,
    onChunkOrUserId?: ((chunk: string) => void) | string,
    userId?: string
  ): Promise<{ results: LearningItemMetadata[] }> {
    const onChunk = typeof onChunkOrUserId === "function" ? onChunkOrUserId : undefined;
    const resolvedUserId = typeof onChunkOrUserId === "string" ? onChunkOrUserId : userId;

    const hash = generateHash({ items, targetLanguage, nativeLanguage, translationInstruction });
    const cached = await aiRepository.getCache(hash, "gemini_enrich");
    if (cached) {
      if (onChunk) onChunk(JSON.stringify(cached));
      return cached as { results: LearningItemMetadata[] };
    }

    if (resolvedUserId) {
      const limit = await checkRateLimit("gemini_enrich", resolvedUserId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI enrichment");
    }
    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            results: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING, description: "Part of speech (noun, verb, adjective, adverb, pronoun, preposition, conjunction, determiner, particle) or 'STRUCTURE'." },
                  level: { type: SchemaType.STRING, description: "CEFR level (A1, A2, B1, B2, C1, C2)." },
                  translation: { type: SchemaType.STRING, description: "Main translation to native language." },
                  explanation: { type: SchemaType.STRING, description: "Pedagogical explanation for grammatical structures; leave empty for vocabulary." },
                  phonetic: { type: SchemaType.STRING, description: "Phonetic transcription (IPA) for vocabulary; leave empty for structures." },
                  forms: { 
                    type: SchemaType.OBJECT,
                    properties: {
                      base: { type: SchemaType.STRING },
                      past: { type: SchemaType.STRING },
                      participle: { type: SchemaType.STRING },
                      plural: { type: SchemaType.STRING }
                    }
                  },
                  examples: { 
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        text: { type: SchemaType.STRING },
                        translation: { type: SchemaType.STRING }
                      }
                    }
                  },
                  synonyms: { 
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING }
                  },
                  meanings: { 
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        definition: { type: SchemaType.STRING },
                        translation: { type: SchemaType.STRING }
                      }
                    }
                  },
                  is_visual: { type: SchemaType.BOOLEAN },
                  key_image_words: { type: SchemaType.STRING }
                }
              }
            }
          },
          required: ["results"]
        }
      }
    });

    const prompt = `Generate pedagogical metadata for the following items in the ${targetLanguage} language.
    ${translationInstruction}. Student's native language: ${nativeLanguage}.
    
    ${getStructureTaxonomy(nativeLanguage)}
    
    Items to enrich:
    ${JSON.stringify(items, null, 2)}
    
    ${getEnrichFormatRules(nativeLanguage)}

    Return a JSON with the "results" key, which must be an array maintaining THE SAME ORDER as the items sent.`;

    let finalResult: { results: LearningItemMetadata[] };
    let rawText = "";
    try {
      if (onChunk) {
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          const t = chunk.text();
          rawText += t;
          onChunk(t);
        }
      } else {
        const result = await model.generateContent(prompt);
        rawText = result.response.text();
      }

      try {
        finalResult = JSON.parse(rawText);
      } catch {
        const cleaned = cleanJsonString(rawText);
        finalResult = JSON.parse(cleaned);
      }
    } catch (error) {
      console.error("[aiService.enrichBatchLearningItems] Failed to process AI response.");
      console.error("Raw Response Text (potentially truncated):", rawText);
      throw error;
    }

    await aiRepository.setCache(hash, "gemini_enrich", finalResult, 120);
    return finalResult;
  },
  /**
   * Step 2: Media Transcription.
   * Uses Gemini Pro's multimodal features to transcribe video/audio and generate word-level segments.
   * Supports both synchronous (returns full result) and streaming (via onChunk callback).
   */

  async transcribeMedia(
    url: string,
    type: 'video' | 'audio',
    onChunkOrUserId?: ((chunk: string) => void) | string,
    userId?: string
  ): Promise<{ full_text: string; segments: Array<{ word: string; start: number; end: number }> }> {
    const onChunk = typeof onChunkOrUserId === "function" ? onChunkOrUserId : undefined;
    const resolvedUserId = typeof onChunkOrUserId === "string" ? onChunkOrUserId : userId;

    if (resolvedUserId) {
      const limit = await checkRateLimit("gemini_transcribe", resolvedUserId, 20);
      if (!limit.success) throw new Error("Rate limit exceeded for AI transcription");

      // T4.3: Daily budget (max 10 transcriptions per day)
      const dailyBudget = await checkDailyBudget("gemini_transcribe", resolvedUserId, 15);
      if (!dailyBudget.success) throw new Error("Daily transcription budget exceeded (max 10/day)");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.media}`
    });

    // Fetch media and convert to Part
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch media for transcription");
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || (type === "video" ? "video/mp4" : "audio/mpeg");

    const prompt = `Transcribe the content of this ${type} file exactly as spoken.
    
    CRITICAL SEGMENTATION RULE:
    - You MUST segment the transcription into complete, natural sentences or long clauses (typically 5 to 15 words per segment).
    - NEVER segment the text into individual words or short fragments (e.g., "This is", "the brief", "on basic").
    - Even though the JSON key is named "word", its value MUST be a full sentence (e.g., "This is the brief on basic English pronouns and simple sentences.").
    - The "start" timestamp must be when the first word of the sentence is spoken, and the "end" timestamp must be when the last word of the sentence is finished.

    CRITICAL TIMESTAMP ACCURACY RULES:
    1. Listen to the audio timeline with maximum precision.
    2. The "start" and "end" of each sentence must align EXACTLY with when the spoken words are heard on the audio playback timeline.
    3. Timestamps MUST be strictly sequential, increasing, and non-overlapping (e.g., Segment 2 start time must be >= Segment 1 end time).
    4. Do not approximate or guess. Pay close attention to the exact millisecond when the speech segment starts and ends.

    DO NOT add scene descriptions, explanatory dialogues, summaries, or comments.
    The transcription must be in the language spoken in the media.
    
    CRITICAL TIMESTAMP FORMATTING:
    - The "start" and "end" timestamps MUST be STRINGS in "MM:SS.mmm" format.
    - 1 minute and 10.425 seconds must be "01:10.425".
    - 10 seconds must be "00:10.000".
    - 2 minutes and 5 seconds must be "02:05.000".
    - DO NOT use numbers. DO NOT use total seconds. If you return a number like 70.425 or 110.425, it will fail.
    
    Respond EXACTLY in this format:
    TRANSCRIPTION_START
    (full transcription text here)
    TRANSCRIPTION_END
    SEGMENTS_JSON_START
    [
      { "word": "Full sentence text here...", "start": "MM:SS.mmm", "end": "MM:SS.mmm" }
    ]
    SEGMENTS_JSON_END`;

    const result = await model.generateContentStream([
      prompt,
      {
        inlineData: {
          data: Buffer.from(buffer).toString("base64"),
          mimeType
        }
      }
    ]);

    let fullResponse = "";
    let lastSentLength = 0;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullResponse += text;

      const startMarker = "TRANSCRIPTION_START";
      const endMarker = "TRANSCRIPTION_END";

      const startIndex = fullResponse.indexOf(startMarker);
      if (startIndex !== -1) {
        const contentStart = startIndex + startMarker.length;
        const endIndex = fullResponse.indexOf(endMarker, contentStart);

        const effectiveEnd = endIndex !== -1 ? endIndex : fullResponse.length;
        const currentContent = fullResponse.substring(contentStart, effectiveEnd);

        const newChunk = currentContent.substring(lastSentLength);
        if (newChunk && onChunk) {
          onChunk(newChunk);
          lastSentLength = currentContent.length;
        }
      }
    }

    // Parse final result
    const fullTextMatch = fullResponse.match(/TRANSCRIPTION_START([\s\S]*?)TRANSCRIPTION_END/);
    const segmentsMatch = fullResponse.match(/SEGMENTS_JSON_START([\s\S]*?)SEGMENTS_JSON_END/);

    const full_text = fullTextMatch ? fullTextMatch[1].trim() : "";
    const rawSegmentsData = segmentsMatch ? segmentsMatch[1] : "[]";
    
    console.log(`[AI_TRANSCRIPTION] Raw segments string length: ${rawSegmentsData.length}`);
    const rawSegments = JSON.parse(cleanJsonString(rawSegmentsData));

    // Helper to parse MM:SS.mmm to seconds
    const parseAiTime = (timeValue: unknown): number => {
      if (timeValue === undefined || timeValue === null) return 0;
      const str = String(timeValue).trim();
      
      // 1. Handle MM:SS.mmm (The intended format)
      const colonMatch = str.match(/^(\d+):(\d{1,2})(?:\.(\d+))?$/);
      if (colonMatch) {
        const [, m, s, ms] = colonMatch;
        return parseInt(m, 10) * 60 + parseInt(s, 10) + (ms ? parseInt(ms.padEnd(3, "0").substring(0, 3), 10) / 1000 : 0);
      }

      // 2. Handle numeric or "dot" formatted hallucinations (e.g. 110.425 or "110.425")
      const numValue = parseFloat(str);
      if (!isNaN(numValue)) {
         const parts = str.split(".");
         const integerPart = Math.abs(parseInt(parts[0], 10));
         
         // If it's something like 110.425, it's almost certainly M:SS.mmm represented as MSS.mmm
         // Rule: If it's 100 or more, we assume the first digits are minutes.
         if (integerPart >= 100) {
            const mins = Math.floor(integerPart / 100);
            const secs = integerPart % 100;
            const ms = parts[1] ? parseInt(parts[1].padEnd(3, "0").substring(0, 3), 10) : 0;
            const repaired = mins * 60 + (secs >= 60 ? 59 : secs) + ms / 1000;
            console.warn(`[AI_TIME_REPAIR] Fixed numeric hallucination: ${str} -> ${repaired}s`);
            return repaired;
         }
         return numValue; 
      }
      
      return 0;
    };

    const segments = (rawSegments as Array<{ start: unknown; end: unknown; word: string }>).map((s) => ({
      ...s,
      start: parseAiTime(s.start),
      end: parseAiTime(s.end),
    }));

    return { full_text, segments };

  },


  /**
   * Step 6: Pedagogical Quality Audit.
   * Analyzes lesson content against a 6-pillar instructional design matrix.
   * Streams chunks via callback, returns structured audit result.
   */
  async streamQualityAnalysis(
    contentText: string,
    level: CEFRLevel,
    onChunk: (chunk: string) => void,
    nativeLanguage: string,
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_quality", userId, 20);
      if (!limit.success) throw new Error("Rate limit exceeded for quality analysis");
    }

    const sectionSchema: Schema = {
      type: SchemaType.OBJECT,
      properties: {
        status: { type: SchemaType.STRING, format: "enum", enum: ["pass", "partial", "fail"] },
        feedback: { type: SchemaType.STRING },
      },
      required: ["status", "feedback"],
    };

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            isCompliant: { type: SchemaType.BOOLEAN },
            score: { type: SchemaType.NUMBER },
            suggestedLevel: { type: SchemaType.STRING, format: "enum", enum: ["A1", "A2", "B1", "B2", "C1", "C2"] },
            sections: {
              type: SchemaType.OBJECT,
              properties: {
                objective: sectionSchema,
                vocabulary: sectionSchema,
                contextualization: sectionSchema,
                guidedPractice: sectionSchema,
                freeConversation: sectionSchema,
                consolidation: sectionSchema,
              },
              required: ["objective", "vocabulary", "contextualization", "guidedPractice", "freeConversation", "consolidation"],
            },
            generalFeedback: { type: SchemaType.STRING },
          },
          required: ["isCompliant", "score", "suggestedLevel", "sections", "generalFeedback"],
        },
      },
    });

    const MAX_QUALITY_TOKENS = 8500; // ~30k chars
    const safeContent = truncateByTokens(contentText, MAX_QUALITY_TOKENS);
    const tokens = approximateTokens(safeContent);
    
    if (safeContent !== contentText) {
      console.warn(`[aiService.streamQualityAnalysis] Content truncated to ${MAX_QUALITY_TOKENS} tokens.`);
    }
    console.log(`[aiService.streamQualityAnalysis] Input tokens: ${tokens}`);

    const prompt = `Act as an Instructional Design Expert and Language Teacher Mentor.
Analyze the lesson script below (CEFR level ${level}) based on the Pedagogical Audit Matrix. Your entire response must be in ${nativeLanguage}.

PEDAGOGICAL AUDIT MATRIX:
${getQualityAnalysisCriteria(nativeLanguage)}

INSTRUCTIONS:
1. Analyze if each of the 6 pillars is present (pass), partial, or missing (fail).
2. Estimate the overall score from 0 to 100.
3. Suggest the actual CEFR level based on the vocabulary and grammar used.
4. Provide professional and direct general feedback in ${nativeLanguage}.

LESSON CONTENT:
"""
${safeContent}
"""`;

    const result = await model.generateContentStream(prompt);

    let fullText = "";
    for await (const chunk of result.stream) {
      const t = chunk.text();
      fullText += t;
      onChunk(t);
    }

    return JSON.parse(fullText);
  },

  /**
   * Step 7: Merge and deduplicate learning items from two sources.
   * Pure utility — no AI call. Deduplicates by lemma (case-insensitive).
   * In case of conflict, keeps the item with the longer contextual_meaning.
   */
  mergeAndDeduplicateItems(
    transcriptionItems: Array<{ lemma: string; type: string; contextual_meaning: string }>,
    lessonItems: Array<{ lemma: string; type: string; contextual_meaning: string }>
  ) {
    const map = new Map<string, { lemma: string; type: string; contextual_meaning: string }>();

    for (const item of [...transcriptionItems, ...lessonItems]) {
      const key = item.lemma.toLowerCase().trim();
      const existing = map.get(key);
      if (!existing || item.contextual_meaning.length > existing.contextual_meaning.length) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  },

  /**
   * Deduplicates structures by name (case-insensitive).
   */
  mergeAndDeduplicateStructures(
    transcriptionStructures: Array<{ name: string; type: string; example_from_text: string }>,
    lessonStructures: Array<{ name: string; type: string; example_from_text: string }>
  ) {
    const map = new Map<string, { name: string; type: string; example_from_text: string }>();

    for (const item of [...transcriptionStructures, ...lessonStructures]) {
      const key = item.name.toLowerCase().trim();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  },



  /**
   * Generates a batch of placement test questions in a single AI call.
   * This is much more efficient for API quotas than generating one by one.
   */
  async generatePlacementQuestionsBatch(
    items: Array<{ lemma: string; type: string; metadata: LearningItemMetadata }>,
    cefrLevel: CEFRLevel,
    skill: "grammar" | "vocabulary" | "reading" | "listening",
    targetLanguage: string,
    nativeLanguage: string,
    userId?: string
  ): Promise<{ questions: PlacementAIQuestion[] }> {
    const hash = generateHash({ items, cefrLevel, skill, targetLanguage, nativeLanguage });
    const cached = await aiRepository.getCache(hash, "gemini_placement_batch");
    if (cached) {
      return cached as { questions: PlacementAIQuestion[] };
    }

    if (userId) {
      const limit = await checkRateLimit("gemini_placement_gen", userId, 25);
      if (!limit.success) throw new Error("Rate limit exceeded for AI generation");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  learningItemId: { type: SchemaType.STRING },
                  content: { type: SchemaType.STRING },
                  context: { type: SchemaType.STRING },
                  audio_script: { type: SchemaType.STRING },
                  options: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        id: { type: SchemaType.STRING },
                        text: { type: SchemaType.STRING }
                      },
                      required: ["id", "text"]
                    }
                  },
                  correct_option_id: { type: SchemaType.STRING }
                },
                required: ["content", "options", "correct_option_id"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const prompt = `Generate a batch of multiple-choice questions for a ${targetLanguage} placement test.
    Target Level: ${cefrLevel}.
    Skill: ${skill}.
    
    Learning Items:
    ${items.map(item => `- ${item.lemma} (${item.type})`).join("\n")}
    
    Rules:
    1. Generate EXACTLY one question for each item in the list above.
    2. The "learningItemId" field must be the corresponding "lemma" for mapping.
    3. Each question must have 4 options (ids: a, b, c, d).
    4. ${skill === "listening" ? "Generate an 'audio_script' for each question." : "The 'content' field must be the question."}
    5. The questions, options, and scripts must be in ${targetLanguage}. 
    6. If contextual help is needed, it should be in ${nativeLanguage}.
    
    Return the JSON in the specified format.`;

    const result = await model.generateContent(prompt);
    const finalResult = JSON.parse(result.response.text()) as { questions: PlacementAIQuestion[] };

    await aiRepository.setCache(hash, "gemini_placement_batch", finalResult, 90);
    return finalResult;
  },

  async generatePlacementQuestionFromItem(
    item: { lemma: string; type: string; metadata: LearningItemMetadata },
    cefrLevel: CEFRLevel,
    skill: "grammar" | "vocabulary" | "reading" | "listening",
    targetLanguage: string,
    nativeLanguage: string,
    userId?: string
  ): Promise<PlacementAIQuestion> {
    const hash = generateHash({ item, cefrLevel, skill, targetLanguage, nativeLanguage });
    const cached = await aiRepository.getCache(hash, "gemini_placement_single");
    if (cached) return cached as PlacementAIQuestion;

    if (userId) {
      const limit = await checkRateLimit("gemini_placement_gen", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI generation");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`, // Use fast model for single question generation
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            content: { type: SchemaType.STRING },
            context: { type: SchemaType.STRING },
            audio_script: { type: SchemaType.STRING }, // Used if skill is listening
            options: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  text: { type: SchemaType.STRING }
                },
                required: ["id", "text"]
              }
            },
            correct_option_id: { type: SchemaType.STRING }
          },
          required: ["content", "options", "correct_option_id"]
        }
      }
    });

    const isListening = skill === "listening";
    const meta = item.metadata as { meanings?: Array<{ definition: string }> };
    const prompt = `Generate a multiple-choice question for an adaptive placement test.
    Language: ${targetLanguage}.
    Target Level: ${cefrLevel}.
    Skill: ${skill}.
    Base Concept: "${item.lemma}" (${item.type}).
    Definition: ${JSON.stringify(meta.meanings?.[0]?.definition || "")}.
    
    Rules:
    1. The question must be impossible to answer without understanding the base concept.
    2. Generate 4 options. Option IDs must be "a", "b", "c", "d".
    ${isListening ? "3. Since the skill is LISTENING, generate an 'audio_script' (a short, simple monologue) that the student would hear. The 'content' must be the question about what was heard." : "3. The 'content' is the text of the question."}
    4. Provide an optional 'context' in ${nativeLanguage} if it helps in understanding the question's situation.
    5. The question and options themselves must be in ${targetLanguage}.
    
    Return only the JSON.`;

    const result = await model.generateContent(prompt);
    const question = JSON.parse(result.response.text()) as PlacementAIQuestion;

    await aiRepository.setCache(hash, "gemini_placement_single", question, 90);
    return question;
  },

  /**
   * Step 9: Automated Quiz Generation.
   * Generates a pedagogical quiz based on lesson content and prioritized learning items.
   * Supports optional streaming via onChunk callback.
   */
  async generateQuiz({
    contentText,
    level,
    items,
    targetLanguage,
    nativeLanguage,
    onChunk,
    transcriptionSegments,
    userId
  }: {
    contentText: string;
    level: CEFRLevel;
    items: QuizItem[];
    targetLanguage: string;
    nativeLanguage: string;
    onChunk?: (chunk: string) => void;
    transcriptionSegments?: Array<{ word: string, start: number, end: number }>;
    userId?: string;
  }): Promise<QuizData> {
    const hash = generateHash({ contentText, level, items, targetLanguage, nativeLanguage, transcriptionSegments });
    const cached = await aiRepository.getCache(hash, "gemini_quiz_gen");
    if (cached) {
      if (onChunk) onChunk(JSON.stringify(cached));
      return cached as QuizData;
    }

    if (userId) {
      const limit = await checkRateLimit("gemini_quiz_gen", userId, 20);
      if (!limit.success) throw new Error("Rate limit exceeded for quiz generation");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.fast}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            quiz_sections: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING, format: "enum", enum: ["vocabulary", "grammar", "timestamp", "context", "comprehension"] },
                  questions: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        text: { type: SchemaType.STRING },
                        options: {
                          type: SchemaType.ARRAY,
                          items: { type: SchemaType.STRING }
                        },
                        correctIndex: { type: SchemaType.NUMBER },
                        explanation: { type: SchemaType.STRING },
                        audioRange: {
                          type: SchemaType.OBJECT,
                          properties: {
                            start: { type: SchemaType.NUMBER },
                            end: { type: SchemaType.NUMBER }
                          },
                          required: ["start", "end"]
                        }
                      },
                      required: ["text", "options", "correctIndex", "explanation"]
                    }
                  }
                },
                required: ["type", "questions"]
              }
            }
          },
          required: ["quiz_sections"]
        }
      }
    });

    const coreItems = items.filter(i => i.priority === "CORE").map(i => i.item?.lemma).filter(Boolean).join(", ");

    const prompt = `Create a structured pedagogical quiz for a level ${level} lesson.
    You must base the questions on TWO sources:
    1. LESSON CONTENT: The theoretical and explanatory text provided below.
    2. AUDIO TRANSCRIPTION: The actual audio segments provided below.
    
    Lesson Content:
    "${contentText}"

    Priority Learning Items (CORE):
    ${coreItems}

    ${transcriptionSegments ? `SENTENCE TRANSCRIPTION (Use these phrases to create contextualized questions):
    ${JSON.stringify(transcriptionSegments.slice(0, 80).map(s => ({ text: s.word, start: s.start, end: s.end })), null, 2)}` : ""}
    
    STRUCTURE RULES (Generate 5 sections):
    1. vocabulary: Translation of words and phrases present in both the text and audio. Prioritize the CORE items listed above.
    2. grammar: Focused on structures explained in the text and used in the audio.
    3. timestamp: Questions EXCLUSIVELY about what was said in the audio. 
       - Use the SENTENCE TRANSCRIPTION to create questions about entire phrases (complete thoughts).
       - Fill "audioRange" with exact start/end of the chosen sentence.
    4. context: Questions about practical usage or cultural nuances identified in the content or speech.
    5. comprehension: Test general understanding by integrating what was read and what was heard.
       - Include "audioRange" when the question references specific spoken parts.

    LANGUAGE RULES:
    - The question prompt ("text") and the "explanation" must be in ${nativeLanguage}.
    - The "options" must be in the TARGET LANGUAGE (${targetLanguage}).
    - 4 options per question.`;

    let finalResult: QuizData;
    if (onChunk) {
      const result = await model.generateContentStream(prompt);
      let fullText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullText += text;
        onChunk(text);
      }
      finalResult = JSON.parse(fullText);
    } else {
      const result = await model.generateContent(prompt);
      finalResult = JSON.parse(result.response.text());
    }

    await aiRepository.setCache(hash, "gemini_quiz_gen", finalResult, 60);
    return finalResult;
  },

  async generateNotebookQuizFromContent(
    content: string,
    nativeLanguage: string,
    targetLanguage: string,
    level: string,
    userId?: string
  ): Promise<NotebookQuizData> {
    const hash = generateHash({ content, nativeLanguage, targetLanguage, level });
    const cached = await aiRepository.getCache(hash, "gemini_notebook_quiz_gen");
    if (cached) return cached as NotebookQuizData;

    if (userId) {
      const limit = await checkRateLimit("gemini_notebook_quiz_gen", userId, 10);
      if (!limit.success) throw new Error("Rate limit exceeded for AI Quiz generation");
    }

    const model = genAI.getGenerativeModel({
      model: `models/${MODELS.pro}`,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            questions: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  id: { type: SchemaType.STRING },
                  type: { type: SchemaType.STRING, format: "enum", enum: ["multiple-choice", "written"] },
                  category: { type: SchemaType.STRING, format: "enum", enum: ["comprehension", "grammar", "vocabulary", "review"] },
                  questionText: { type: SchemaType.STRING },
                  options: {
                    type: SchemaType.ARRAY,
                    items: {
                      type: SchemaType.OBJECT,
                      properties: {
                        id: { type: SchemaType.STRING },
                        text: { type: SchemaType.STRING }
                      },
                      required: ["id", "text"]
                    }
                  },
                  correctOptionId: { type: SchemaType.STRING },
                  correctWrittenAnswer: { type: SchemaType.STRING },
                  explanations: {
                    type: SchemaType.OBJECT,
                    description: "Explanations for options (A, B, C, D) or general written feedback.",
                    properties: {
                      A: { type: SchemaType.STRING },
                      B: { type: SchemaType.STRING },
                      C: { type: SchemaType.STRING },
                      D: { type: SchemaType.STRING },
                      general: { type: SchemaType.STRING }
                    }
                  }
                },
                required: ["id", "type", "category", "questionText", "explanations"]
              }
            }
          },
          required: ["questions"]
        }
      }
    });

    const prompt = `Act as an expert language teacher and pedagogical designer.
    Your task is to generate a comprehensive 10-QUESTION quiz based strictly on the provided lesson/notebook content.
    
    CONTENT:
    "${content}"
    
    The student's native language is: ${nativeLanguage}
    The target language they are learning is: ${targetLanguage}
    The CEFR target level of this quiz is: ${level}
    
    The quiz must satisfy these strictly enforced pedagogical rules:
    1. Exactly 10 questions.
    2. Vary the types of questions: 5 must be multiple-choice ("multiple-choice") and 5 must be written fill-in-the-blanks ("written").
    3. Vary the categories: include a balanced mix of "comprehension", "grammar", "vocabulary", and "review".
    4. For multiple-choice questions, provide exactly 4 options (options array must contain 4 items with IDs like "A", "B", "C", "D").
    5. For written questions, the student will type their answer. Provide a single correct answer in "correctWrittenAnswer" (keep it simple, 1-3 words maximum, usually just the correct word or phrase to fill the gap).
    6. Extremely important: You must provide a clear and didactic explanation for each option in multiple-choice questions (explaining why a specific option is correct, and why each incorrect option is wrong/misleading). For written questions, provide a "general" key inside explanations detailing the grammatical or vocabulary rule and why that answer is correct.
    7. The explanations and instruction text must be written in the student's native language (${nativeLanguage}) to facilitate student comprehension.
    8. The questions themselves and options must be primarily in the target language (${targetLanguage}), tailored to the ${level} CEFR level.
    
    Return a JSON containing a "questions" array matching the defined structure.`;

    const result = await model.generateContent(prompt);
    let finalResult: NotebookQuizData;
    try {
      finalResult = JSON.parse(result.response.text());
    } catch {
      const cleaned = cleanJsonString(result.response.text());
      finalResult = JSON.parse(cleaned);
    }

    await aiRepository.setCache(hash, "gemini_notebook_quiz_gen", finalResult, 30);
    return finalResult;
  }
};

