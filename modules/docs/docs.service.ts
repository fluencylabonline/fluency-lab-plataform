import "server-only";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { env } from "@/env/server";
import { checkDailyBudget, checkRateLimit } from "@/lib/rate-limit";
import { aiRepository } from "@/modules/ai/ai.repository";
import { generateHash } from "@/modules/ai/ai.utils";
import { getArticleIds, getDocsCorpus } from "./docs.corpus";
import { docsRepository } from "./docs.repository";
import type { DocAudience } from "./docs.registry";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const MODEL = "gemini-2.5-flash";
const CACHE_SERVICE = "docs_ai";

/**
 * Limites em camadas. Os dois primeiros protegem contra abuso individual; o
 * terceiro é o que mantém o consumo abaixo da cota gratuita do Gemini, fazendo
 * o erro ser nosso — previsível e com mensagem clara — em vez de um 429 do
 * Google no meio da requisição.
 */
const LIMITS = {
  perUserHourly: 15,
  perUserDaily: 40,
  globalDaily: 200,
};

export type AskDocsFailure = "rate_limited" | "quota_exhausted" | "unavailable";

export interface AskDocsResult {
  questionId: string;
  answer: string;
  foundAnswer: boolean;
  articleIds: string[];
  wasCached: boolean;
}

/** Erro tipado para a action traduzir em mensagem sem inspecionar strings. */
export class AskDocsError extends Error {
  constructor(public readonly reason: AskDocsFailure) {
    super(reason);
    this.name = "AskDocsError";
  }
}

interface ModelAnswer {
  foundAnswer: boolean;
  answer: string;
  articleIds: string[];
}

function buildPrompt(corpus: string, question: string): string {
  return `Você é o assistente da Central de Ajuda de uma escola de idiomas. Responde dúvidas sobre COMO USAR A PLATAFORMA, com base EXCLUSIVAMENTE na documentação abaixo.

REGRAS OBRIGATÓRIAS:
1. Responda SOMENTE com informação presente na documentação. Nunca deduza, complete ou invente regras, prazos, valores ou percentuais.
2. Se a documentação não cobrir a pergunta, devolva "foundAnswer": false e deixe "answer" vazio. Não tente ajudar assim mesmo. É melhor não responder do que dar uma resposta errada sobre multa, prazo ou pagamento.
3. Se a pergunta for sobre um caso específico (um aluno, um valor, uma cobrança concreta) que a documentação não permite verificar, devolva "foundAnswer": false — você não tem acesso aos dados da escola, apenas à documentação.
4. Em "articleIds", liste os ids dos artigos que sustentam a resposta, copiados exatamente do marcador [id: ...]. Nunca invente um id.
5. Escreva em português do Brasil, de forma direta e prática. Prefira passo a passo quando a pergunta for "como faço".
6. Use **negrito** para destacar nomes de botões e valores importantes. Não use títulos nem listas numeradas com markdown de cabeçalho.
7. Seja conciso: no máximo dois parágrafos curtos ou uma lista de até 6 passos.

DOCUMENTAÇÃO:
${corpus}

PERGUNTA DO USUÁRIO:
${question}`;
}

export const docsService = {
  async askDocs(params: {
    question: string;
    audience: DocAudience;
    userId: string;
  }): Promise<AskDocsResult> {
    const question = params.question.trim();

    // O discriminador de serviço é obrigatório: o índice único de `ai_cache` é
    // só na coluna `hash`, mas `getCache` filtra por hash AND serviceName. Sem
    // ele, uma colisão com outro serviço quebraria o cache silenciosamente.
    const hash = generateHash({
      v: 1,
      service: CACHE_SERVICE,
      audience: params.audience,
      question: question.toLowerCase(),
    });

    const cached = (await aiRepository.getCache(hash, CACHE_SERVICE)) as ModelAnswer | null;

    if (cached) {
      // Ainda registramos a pergunta: para mapear lacunas o que importa é o que
      // foi perguntado, não se a resposta veio da API ou do cache.
      const row = await docsRepository.createQuestion({
        userId: params.userId,
        audience: params.audience,
        question,
        answer: cached.answer,
        foundAnswer: cached.foundAnswer,
        articleIds: cached.articleIds,
        wasCached: true,
      });

      return {
        questionId: row.id,
        answer: cached.answer,
        foundAnswer: cached.foundAnswer,
        articleIds: cached.articleIds,
        wasCached: true,
      };
    }

    const hourly = await checkRateLimit(
      "docs_ai",
      params.userId,
      LIMITS.perUserHourly,
      3600 * 1000,
    );
    if (!hourly.success) throw new AskDocsError("rate_limited");

    const daily = await checkDailyBudget("docs_ai", params.userId, LIMITS.perUserDaily);
    if (!daily.success) throw new AskDocsError("rate_limited");

    const global = await checkRateLimit(
      "docs_ai_global",
      "global",
      LIMITS.globalDaily,
      24 * 3600 * 1000,
    );
    if (!global.success) throw new AskDocsError("quota_exhausted");

    let parsed: ModelAnswer;
    try {
      const model = genAI.getGenerativeModel({
        model: `models/${MODEL}`,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              foundAnswer: { type: SchemaType.BOOLEAN },
              answer: { type: SchemaType.STRING },
              articleIds: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ["foundAnswer", "answer", "articleIds"],
          },
        },
      });

      const prompt = buildPrompt(getDocsCorpus(params.audience), question);
      const result = await model.generateContent(prompt);
      parsed = JSON.parse(result.response.text()) as ModelAnswer;
    } catch (error) {
      console.error("[docsService.askDocs] Gemini error:", error);
      // 429 = cota da API esgotada. Merece mensagem diferente de falha genérica.
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("429") || /quota|rate limit|resource_exhausted/i.test(message)) {
        throw new AskDocsError("quota_exhausted");
      }
      throw new AskDocsError("unavailable");
    }

    // Descarta citações inventadas: só sobrevivem ids que existem de verdade.
    const validIds = getArticleIds(params.audience);
    const articleIds = (parsed.articleIds ?? []).filter((id) => validIds.has(id));

    // Sem nenhuma citação válida a resposta não é verificável — trata como
    // "não encontrei" para cair no caminho de contato com a coordenação.
    const foundAnswer = parsed.foundAnswer && articleIds.length > 0 && !!parsed.answer?.trim();
    const answer = foundAnswer ? parsed.answer.trim() : "";

    const payload: ModelAnswer = { foundAnswer, answer, articleIds };
    await aiRepository.setCache(hash, CACHE_SERVICE, payload, 30);

    const row = await docsRepository.createQuestion({
      userId: params.userId,
      audience: params.audience,
      question,
      answer,
      foundAnswer,
      articleIds,
      wasCached: false,
    });

    return {
      questionId: row.id,
      answer,
      foundAnswer,
      articleIds,
      wasCached: false,
    };
  },
};
