import { GoogleGenAI, ThinkingLevel, type ThinkingConfig } from "@google/genai";
import { z } from "zod";

/**
 * Cliente do Google Gemini. Server-side apenas — a chave nunca vai ao browser.
 * Nunca importar de um "use client".
 *
 * gemini-flash-latest: alias que o Google mantém apontando para o modelo flash
 * atual do tier gratuito. Lê PDF e imagem nativamente e devolve JSON
 * estruturado. Alimenta o parse do CV, a extração de vaga e a geração do e-mail.
 *
 * Por que o alias e não uma versão fixa: o `gemini-2.5-flash` fixo passou a
 * responder 404 "no longer available to new users". O alias evita esse
 * envelhecimento — sempre resolve para o flash vigente.
 */
let client: GoogleGenAI | null = null;

export function gemini() {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY não configurada. Veja .env.example.");
    }
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

export const MODEL = "gemini-flash-latest";

/**
 * Nível de raciocínio de toda chamada. O flash novo raciocina por padrão, o que
 * deixa a chamada lenta e estoura o tempo da função na Vercel; "low" mantém a
 * extração da vaga e a geração do e-mail em ~1,5–2,5s.
 *
 * NÃO voltar para `thinkingBudget: 0`: o alias gemini-flash-latest migrou para
 * o Gemini 3.x, que rejeita esse campo com 400 INVALID_ARGUMENT — foi o que
 * derrubou as três rotas de IA em produção. O 3.x usa `thinkingLevel`.
 */
export const THINKING: ThinkingConfig = { thinkingLevel: ThinkingLevel.LOW };

/**
 * Repete a chamada em erros transitórios do tier gratuito.
 *
 * 429 (cota por minuto), 500 e 503 ("high demand... try again later") são
 * comuns no free e não indicam bug — sem o retry, o usuário perderia um
 * onboarding à toa. Backoff exponencial com jitter: ~1s, 2s, 4s.
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  const RETRIABLE = new Set([429, 500, 503]);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as { status?: number })?.status;
      if (status === undefined || !RETRIABLE.has(status) || attempt === 3) throw err;
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 500));
    }
  }
  throw lastErr;
}

/**
 * Converte um schema Zod para o JSON Schema que o Gemini aceita em
 * responseJsonSchema. Remove a chave `$schema` (o Gemini rejeita a meta-chave).
 */
export function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const js = z.toJSONSchema(schema) as Record<string, unknown>;
  delete js["$schema"];
  return js;
}

/** Parte de conteúdo: texto ou mídia (PDF/imagem) em base64. */
export type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };
