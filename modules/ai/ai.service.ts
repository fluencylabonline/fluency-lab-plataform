import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "@/env";
import { QuizData, CEFRLevel } from "@/modules/curriculum/curriculum.types";
import { checkRateLimit } from "@/lib/rate-limit";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

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
  async parseLessonContent(text: string, level: CEFRLevel, userId?: string) {
    if (userId) {
      const limit = await checkRateLimit("gemini_parse", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI parsing");
    }
    const model = genAI.getGenerativeModel({
      model: "models/gemini-3.1-pro-preview",
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
                  type: { type: SchemaType.STRING, format: "enum", enum: ["noun", "verb", "adjective", "adverb", "phrasal_verb", "expression"] },
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
                  type: { type: SchemaType.STRING }, // e.g., "s-v-o"
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
    Extraia o vocabulário mais relevante (lemmatized) e as estruturas gramaticais principais.
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
      model: "models/gemini-3.1-pro-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Gere metadados pedagógicos os seguintes itens no idioma ${targetLanguage}.
    ${translationInstruction}. Idioma nativo do aluno: ${nativeLanguage}.
    
    Itens para enriquecer:
    ${JSON.stringify(items, null, 2)}
    
    Retorne um JSON com a chave "results", que deve ser um array mantendo A MESMA ORDEM dos itens enviados. 
    Cada item do array deve seguir estritamente este formato:
    {
      "level": "A1-C2",
      "phonetic": "/.../",
      "is_visual": boolean,
      "key_image_words": "keywords for unsplash search",
      "meanings": [{ "context": "...", "definition": "...", "example": "...", "translation": "translation of context, definition and example (only if requested)" }],
      "forms": { "base": "...", "past": "...", "participle": "...", "plural": "..." },
      "examples": ["example 1", "example 2", "example 3"],
      "synonyms": ["synonym 1", "synonym 2"],
      "translation": "main translation of the lemma (only if requested)"
    }`;

    const result = await model.generateContent(prompt);
    return JSON.parse(cleanJsonString(result.response.text()));
  },

  /**
   * Step 6: Geração de Quiz.
   * Gera um quiz estruturado baseado no texto e transcrição.
   */
  async generateQuiz(lessonContent: string, transcription: unknown[], level: CEFRLevel, userId?: string): Promise<QuizData> {
    if (userId) {
      const limit = await checkRateLimit("gemini_quiz", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI quiz generation");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-3.1-pro-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Gere um quiz educacional completo baseado no texto fornecido e sua transcrição com timestamps.
    Siga as regras de contagem de perguntas:
    - Vocabulary: 5-6 perguntas
    - Grammar: 5-6 perguntas
    - Timestamps: 5-6 perguntas (cruze com a transcrição fornecida)
    - Context: 5-6 perguntas
    - Comprehension: 3-6 perguntas
    
    Cada pergunta deve ter 4 opções, correctIndex e uma explicação pedagógica.
    
    Texto: "${lessonContent}"
    Transcrição: ${JSON.stringify(transcription.slice(0, 100))} (fragmento para contexto)
    Nível: ${level}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
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
      model: "models/gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Transcreva o seguinte ${type} detalhadamente. 
    Retorne um JSON contendo:
    - full_text: string (o texto completo da transcrição)
    - segments: array de objetos { word, start, end } com os tempos em segundos.
    
    Media URL: ${url}`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
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
      model: "models/gemini-1.5-pro",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Transcreva o seguinte ${type} detalhadamente. 
    Retorne um JSON contendo:
    - full_text: string (o texto completo da transcrição)
    - segments: array de objetos { word, start, end } com os tempos em segundos.
    
    Media URL: ${url}`;

    const result = await model.generateContentStream(prompt);

    let fullText = "";
    for await (const chunk of result.stream) {
      const text = chunk.text();
      fullText += text;
      onChunk(text);
    }

    return JSON.parse(fullText);
  },

  /**
   * Stream version of parseLessonContent. Yields text chunks via callback for SSE.
   */
  async streamAnalysis(
    text: string,
    level: CEFRLevel,
    onChunk: (chunk: string) => void,
    userId?: string
  ) {
    if (userId) {
      const limit = await checkRateLimit("gemini_parse", userId, 50);
      if (!limit.success) throw new Error("Rate limit exceeded for AI parsing");
    }

    const model = genAI.getGenerativeModel({
      model: "models/gemini-3.1-pro-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Analise o seguinte texto em nível ${level} para ensino de idiomas. 
    Extraia o vocabulário mais relevante (lemmatized) e as estruturas gramaticais principais.
    Retorne JSON com chaves "vocabulary" e "structures".
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
      model: "models/gemini-3.1-pro-preview",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const prompt = `Gere metadados pedagógicos os seguintes itens no idioma ${targetLanguage}.
    ${translationInstruction}. Idioma nativo do aluno: ${nativeLanguage}.
    
    Itens para enriquecer:
    ${JSON.stringify(items, null, 2)}
    
    Retorne um JSON com a chave "results", que deve ser um array mantendo A MESMA ORDEM dos itens enviados. 
    Cada item do array deve seguir estritamente este formato:
    {
      "level": "A1-C2",
      "phonetic": "/.../",
      "is_visual": boolean,
      "key_image_words": "keywords for unsplash search",
      "meanings": [{ "context": "...", "definition": "...", "example": "...", "translation": "..." }],
      "forms": { "base": "...", "past": "...", "participle": "...", "plural": "..." },
      "examples": ["example 1", "example 2", "example 3"],
      "synonyms": ["synonym 1", "synonym 2"],
      "translation": "main translation of the lemma (only if requested)"
    }`;

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
  }
};
