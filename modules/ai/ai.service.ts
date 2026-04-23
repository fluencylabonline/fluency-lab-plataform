import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { env } from "@/env";
import { QuizData, CEFRLevel, QuizItem, AnalysisResult } from "@/modules/curriculum/curriculum.types";
import { checkRateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const STRUCTURE_TAXONOMY = `
ESTRUTURAS (USE ESTES CÓDIGOS EM "type"):
- A1: "s-v", "s-v-o", "s-v-p-o", "s-av", "s-v-adv"
- A2: "s-v-do-io", "s-v-o-o", "s-av-v-o", "s-v-inf", "s-v-ing"
- B1: "s-v-o-adv", "s-v-o-p-o", "s-v-that-s-v-o", "s-v-wh"
- B2: "passive-s-v-o", "s-modal-v-o", "s-v-o-to-v", "s-v-o-ing"
- C1: "conditional-zero", "conditional-first", "conditional-second", "conditional-third", "relative-clause-def", "relative-clause-nondef", "s-v-o-which-s-v"
- C2: "mixed-conditional", "passive-perfect", "cleft-sentence", "inversion-negative", "s-v-o-participle"
`;

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
    if (userId) {
      const limit = await checkRateLimit("gemini_embedding", userId, 200);
      if (!limit.success) throw new Error("Rate limit exceeded for AI embeddings");
    }
    const model = genAI.getGenerativeModel({ model: "models/gemini-embedding-2-preview" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  },

  /**
   * Step 3: Parser Semântico. 
   * Extrair vocabulário e estruturas sugeridas de um texto.
   */
  async parseLessonContent(text: string, level: CEFRLevel, userId?: string): Promise<AnalysisResult> {
    if (userId) {
      const limit = await checkRateLimit("gemini_parse", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI parsing");
    }
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
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
                  type: { type: SchemaType.STRING }, // Devem ser os códigos como 's-v-o', 'passive-s-v-o', etc.
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

    const prompt = `Analise o seguinte texto em nível ${level} para ensino de idiomas. 
    1. Extraia o vocabulário mais relevante (lemmatized) e classifique-o (noun, verb, etc).
    2. Identifique as estruturas gramaticais principais e mapeie-as para os códigos de estrutura oficiais abaixo.
    
    ${STRUCTURE_TAXONOMY}
    
    Importante: No campo "type" da estrutura, use EXCLUSIVAMENTE um dos códigos acima.
    
    Texto: "${text}"`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
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
    level?: string,
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_enrich", userId, 50); // Batch consumes 1 limit
      if (!limit.success) throw new Error("Rate limit exceeded for AI enrichment");
    }
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Gere metadados pedagógicos os seguintes itens no idioma ${targetLanguage}.
    ${translationInstruction}. Idioma nativo do aluno: ${nativeLanguage}.
    
    ${STRUCTURE_TAXONOMY}
    
    Itens para enriquecer:
    ${JSON.stringify(items, null, 2)}
    
    REGRAS DE FORMATO POR TIPO:
    1. Se o item for VOCABULARY (noun, verb, adjective, etc):
    {
      "type": "noun/verb/...",
      "level": "A1-C2",
      "phonetic": "/.../",
      "translation": "tradução principal",
      "is_visual": boolean,
      "key_image_words": "keywords for unsplash",
      "meanings": [{ "definition": "...", "translation": "..." }],
      "forms": { "base": "...", "past": "...", "participle": "...", "plural": "..." },
      "examples": [{ "text": "...", "translation": "..." }],
      "synonyms": ["..."]
    }

    2. Se o item for STRUCTURE (ex: gramática, padrões de frase):
    {
      "level": "A1-C2",
      "structure_type": "Nome pedagógico (ex: Passive Voice, Mixed Conditional)",
      "syntactic_pattern": "SVO/SV/SVC/SVOO/etc",
      "translation": "nome da estrutura em PT",
      "explanation": "explicação didática clara em PT",
      "examples": [{ 
        "text": "...", 
        "translation": "...", 
        "word_order": [{ "word": "...", "index": 0, "role": "subject/verb/object/etc" }] 
      }]
    }

    Retorne um JSON com a chave "results", que deve ser um array mantendo A MESMA ORDEM dos itens enviados.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(cleanJsonString(result.response.text()));
  },



  /**
   * Step 2: Transcrição Automática.
   * Usa recursos multimodais do Gemini para transcrever vídeo/áudio e gerar segmentos.
   */
  async transcribeMedia(url: string, type: 'video' | 'audio', userId?: string) {
    if (userId) {
      const limit = await checkRateLimit("gemini_transcribe", userId, 20); // Heavy action
      if (!limit.success) throw new Error("Rate limit exceeded for AI transcription");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    // Fetch media and convert to Part
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch media for transcription");
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || (type === "video" ? "video/mp4" : "audio/mpeg");

    const prompt = `Transcreva o conteúdo deste arquivo de ${type} de forma literal e exata, palavra por palavra.
    NÃO adicione descrições de cena, diálogos explicativos, resumos ou comentários.
    
    Responda EXATAMENTE neste formato:
    TRANSCRIPTION_START
    (texto completo da transcrição aqui)
    TRANSCRIPTION_END
    SEGMENTS_JSON_START
    [
      { "word": "palavra", "start": 0.0, "end": 0.5 }
    ]
    SEGMENTS_JSON_END`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: Buffer.from(buffer).toString("base64"),
          mimeType
        }
      }
    ]);

    const fullResponse = result.response.text();
    const fullTextMatch = fullResponse.match(/TRANSCRIPTION_START([\s\S]*?)TRANSCRIPTION_END/);
    const segmentsMatch = fullResponse.match(/SEGMENTS_JSON_START([\s\S]*?)SEGMENTS_JSON_END/);

    const full_text = fullTextMatch ? fullTextMatch[1].trim() : "";
    const segments = segmentsMatch ? JSON.parse(cleanJsonString(segmentsMatch[1])) : [];

    return { full_text, segments };
  },

  /**
   * Stream version of transcribeMedia. Yields text chunks via callback for SSE.
   */
  async streamTranscription(
    url: string,
    type: 'video' | 'audio',
    onChunk: (chunk: string) => void,
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_transcribe", userId, 20);
      if (!limit.success) throw new Error("Rate limit exceeded for AI transcription");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro"
    });

    // Fetch media and convert to Part
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch media for transcription");
    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || (type === "video" ? "video/mp4" : "audio/mpeg");

    const prompt = `Transcreva o conteúdo deste arquivo de ${type} de forma literal e exata, palavra por palavra.
    NÃO adicione descrições de cena, diálogos explicativos, resumos ou comentários.
    
    Responda EXATAMENTE neste formato:
    TRANSCRIPTION_START
    (texto completo da transcrição aqui)
    TRANSCRIPTION_END
    SEGMENTS_JSON_START
    [
      { "word": "palavra", "start": 0.0, "end": 0.5 }
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
        if (newChunk) {
          onChunk(newChunk);
          lastSentLength = currentContent.length;
        }
      }
    }

    // Parse final result
    const fullTextMatch = fullResponse.match(/TRANSCRIPTION_START([\s\S]*?)TRANSCRIPTION_END/);
    const segmentsMatch = fullResponse.match(/SEGMENTS_JSON_START([\s\S]*?)SEGMENTS_JSON_END/);

    const full_text = fullTextMatch ? fullTextMatch[1].trim() : "";
    const segments = segmentsMatch ? JSON.parse(cleanJsonString(segmentsMatch[1])) : [];

    return { full_text, segments };
  },

  /**
   * Stream version of parseLessonContent. Yields text chunks via callback for SSE.
   */
  async streamAnalysis(
    text: string,
    level: CEFRLevel,
    onChunk: (chunk: string) => void,
    userId?: string
  ): Promise<AnalysisResult> {
    if (userId) {
      const limit = await checkRateLimit("gemini_parse", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI parsing");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
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
                  type: { type: SchemaType.STRING },
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

    const prompt = `Analise o seguinte texto em nível ${level} para ensino de idiomas. 
    Extraia o vocabulário mais relevante e as estruturas gramaticais principais.
    
    IMPORTANTE: Retorne OBJETOS para cada item.
    Vocabulário: lemma, type (noun, verb, etc), contextual_meaning.
    Estruturas: type (ex: 's-v-o', 'passive-s-v-o'), name (nome amigável), example_from_text.
    
    Texto: "${text}"`;

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
   * Step 6: Pedagogical Quality Audit.
   * Analyzes lesson content against a 6-pillar instructional design matrix.
   * Streams chunks via callback, returns structured audit result.
   */
  async streamQualityAnalysis(
    contentText: string,
    level: CEFRLevel,
    onChunk: (chunk: string) => void,
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
      model: "models/gemini-2.5-pro",
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

    const AUDIT_CRITERIA = `
1. Objetivo (2-3 min): Conexão com a realidade e "porquê" do aprendizado.
2. Vocabulário e Gramática (15-20 min): Contextualização, exemplos práticos e contraste linguístico.
3. Contextualização (5-10 min): Uso de mini textos ou diálogos.
4. Prática Guiada (20-30 min): Exercícios com andaime (scaffolding).
5. Conversação Livre (15-20 min): Produção oral autônoma.
6. Consolidação (5 min): Revisão técnica e checklist.`;

    const prompt = `Atue como um Especialista em Design Instrucional e Mentor de Professores de Idiomas.
Analise o roteiro de aula abaixo (nível CEFR ${level}) com base na Matriz de Auditoria Pedagógica.

CRITÉRIOS DE ANÁLISE (MATRIZ):
${AUDIT_CRITERIA}

INSTRUÇÕES:
1. Analise se cada um dos 6 pilares está presente (pass), parcial ou ausente (fail).
2. Estime o score geral de 0 a 100.
3. Sugira o nível CEFR real com base no vocabulário e gramática usados.
4. Forneça feedback geral profissional e direto em Português.

CONTEÚDO DA AULA:
"""
${contentText.slice(0, 30000)}
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
   * Stream version of enrichBatchLearningItems. Yields text chunks via callback for SSE.
   */
  async streamEnrichBatch(
    items: Array<{ lemma: string; type: string; context: string }>,
    targetLanguage: string,
    nativeLanguage: string,
    translationInstruction: string,
    onChunk: (chunk: string) => void,
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_enrich", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI enrichment");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Gere metadados pedagógicos os seguintes itens no idioma ${targetLanguage}.
    ${translationInstruction}. Idioma nativo do aluno: ${nativeLanguage}.
    
    ${STRUCTURE_TAXONOMY}
    
    Itens para enriquecer:
    ${JSON.stringify(items, null, 2)}
    
    REGRAS DE FORMATO POR TIPO:
    1. Se o item for VOCABULARY (noun, verb, adjective, etc):
    {
      "type": "noun/verb/...",
      "level": "A1-C2",
      "phonetic": "/.../",
      "translation": "tradução principal",
      "is_visual": boolean,
      "key_image_words": "keywords for unsplash",
      "meanings": [{ "definition": "...", "translation": "..." }],
      "forms": { "base": "...", "past": "...", "participle": "...", "plural": "..." },
      "examples": [{ "text": "...", "translation": "..." }],
      "synonyms": ["..."]
    }

    2. Se o item for STRUCTURE (ex: gramática, padrões de frase):
    {
      "level": "A1-C2",
      "structure_type": "Nome pedagógico (ex: Passive Voice, Mixed Conditional)",
      "syntactic_pattern": "SVO/SV/SVC/SVOO/etc",
      "translation": "nome da estrutura em PT",
      "explanation": "explicação didática clara em PT",
      "examples": [{ 
        "text": "...", 
        "translation": "...", 
        "word_order": [{ "word": "...", "index": 0, "role": "subject/verb/object/etc" }] 
      }]
    }

    Retorne um JSON com a chave "results", que deve ser um array mantendo A MESMA ORDEM dos itens enviados.`;

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
   * Generates a single placement test question based on a curriculum learning item.
   * This is part of the administrative diagnostic loop.
   */
  async generatePlacementQuestionFromItem(
    item: { lemma: string; type: string; metadata: Record<string, unknown> },
    cefrLevel: CEFRLevel,
    skill: "grammar" | "vocabulary" | "reading" | "listening",
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_placement_gen", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI generation");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash", // Use fast model for single question generation
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
    const prompt = `Gere uma questão de múltipla escolha para um teste de nivelamento adaptativo.
    Idioma: Inglês.
    Nível Alvo: ${cefrLevel}.
    Habilidade: ${skill}.
    Conceito Base: "${item.lemma}" (${item.type}).
    Definição: ${JSON.stringify(meta.meanings?.[0]?.definition || "")}.
    
    Regras:
    1. A questão deve ser impossível de responder sem entender o conceito base.
    2. Gere 4 opções. Os IDs das opções devem ser "a", "b", "c", "d".
    ${isListening ? "3. Como a habilidade é LISTENING, gere um 'audio_script' (um monólogo curto e simples) que o aluno ouviria. O 'content' deve ser a pergunta sobre o que foi ouvido." : "3. O 'content' é o texto da pergunta."}
    4. Forneça um 'context' opcional se ajudar na compreensão da situação da pergunta.
    
    Retorne apenas o JSON.`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
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
    onChunk,
    transcriptionSegments,
    userId
  }: {
    contentText: string;
    level: CEFRLevel;
    items: QuizItem[];
    onChunk?: (chunk: string) => void;
    transcriptionSegments?: Array<{ word: string, start: number, end: number }>;
    userId?: string;
  }): Promise<QuizData> {
    if (userId) {
      const limit = await checkRateLimit("gemini_quiz_gen", userId, 20);
      if (!limit.success) throw new Error("Rate limit exceeded for quiz generation");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.0-flash",
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

    const prompt = `Crie um quiz pedagógico estruturado para uma lição de nível ${level}.
    Você deve basear as perguntas em DUAS fontes:
    1. CONTEÚDO DA LIÇÃO: O texto teórico e explicativo fornecido abaixo.
    2. TRANSCRIÇÃO DO ÁUDIO: Os segmentos reais do áudio fornecidos abaixo.
    
    Conteúdo da Lição:
    "${contentText}"

    Itens de Aprendizado Prioritários (CORE):
    ${coreItems}

    ${transcriptionSegments ? `TRANSCRIÇÃO EM SENTENÇAS (Use estas frases para criar perguntas contextualizadas):
    ${JSON.stringify(transcriptionSegments.slice(0, 300), null, 2)}` : ""}
    
    REGRAS DE ESTRUTURA (Gere 5 seções):
    1. vocabulary: Tradução de palavras e frases presentes tanto no texto quanto no áudio. Priorize os itens CORE listados acima.
    2. grammar: Focada em estruturas explicadas no texto e usadas no áudio.
    3. timestamp: Perguntas EXCLUSIVAS sobre o que foi dito no áudio. 
       - Use a TRANSCRIÇÃO EM SENTENÇAS para criar perguntas sobre frases inteiras (pensamentos completos).
       - Preencha "audioRange" com start/end exatos da sentença escolhida.
    4. context: Perguntas sobre o uso prático ou nuances culturais identificadas no conteúdo ou na fala.
    5. comprehension: Teste a compreensão geral integrando o que foi lido e o que foi ouvido.

    REGRAS DE IDIOMA:
    - O enunciado da pergunta ("text") e a "explanation" devem ser em PORTUGUÊS.
    - As "options" devem ser no IDIOMA ALVO (${level}).
    - 4 opções por pergunta.`;

    if (onChunk) {
      const result = await model.generateContentStream(prompt);
      let fullText = "";
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullText += text;
        onChunk(text);
      }
      return JSON.parse(fullText);
    } else {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text());
    }
  }
};
