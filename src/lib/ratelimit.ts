import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

/** Lançada quando o usuário estoura um limite. O handler responde 429. */
export class RateLimitError extends Error {
  constructor() {
    super("rate limit exceeded");
    this.name = "RateLimitError";
  }
}

type Limit = { bucket: string; max: number; windowSeconds: number };

/**
 * Rate limit por usuário via RPC no Postgres (janela fixa, tabela fechada por
 * SECURITY DEFINER — ver migration rate_limits). Aplica cada limite em sequência
 * e lança RateLimitError no primeiro que estourar.
 *
 * Fail-open: se a própria checagem falhar (erro de rede/DB), loga e libera —
 * não faz sentido derrubar uma request legítima porque o contador caiu.
 */
export async function enforceRateLimits(
  supabase: SupabaseClient<Database>,
  limits: Limit[],
): Promise<void> {
  for (const { bucket, max, windowSeconds } of limits) {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_bucket: bucket,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[ratelimit]", bucket, error.message);
      continue;
    }
    if (data === false) throw new RateLimitError();
  }
}

/** Limites das rotas de IA (compartilham a cota do Gemini) e do envio. */
export const AI_LIMITS: Limit[] = [
  { bucket: "ai:min", max: 20, windowSeconds: 60 },
  { bucket: "ai:day", max: 200, windowSeconds: 86_400 },
];

export const SEND_LIMITS: Limit[] = [
  { bucket: "send:min", max: 10, windowSeconds: 60 },
  { bucket: "send:day", max: 30, windowSeconds: 86_400 },
];
