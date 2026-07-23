import { gemini, MODEL, THINKING, toGeminiSchema, withRetry } from "@/lib/ai/gemini";
import { EmailSchema } from "@/lib/ai/job-schemas";
import { EMAIL_GENERATE_SYSTEM } from "@/lib/ai/prompts";
import { loadProfileContext } from "@/lib/db/profile";
import { createClient } from "@/lib/supabase/server";
import { enforceRateLimits, RateLimitError, AI_LIMITS } from "@/lib/ratelimit";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60;

const MAX_JOB_BYTES = 60_000; // o objeto job extraído nunca chega perto disso

/**
 * Gera o e-mail de candidatura a partir do perfil + vaga + match.
 *
 * Retorna JSON (não stream): o structured output garante assunto e corpo
 * separados, e o corpo cabe numa resposta só. A UI anima a chegada com a
 * animação vpSettle do protótipo, não com streaming token a token.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  try {
    await enforceRateLimits(supabase, AI_LIMITS);
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        { error: "Muitas requisições. Aguarde um instante e tente de novo." },
        { status: 429 },
      );
    }
    throw err;
  }

  const body = await request.json().catch(() => null);
  const job = body?.job;
  if (!job || typeof job.company !== "string") {
    return NextResponse.json(
      { error: "dados da vaga ausentes" },
      { status: 400 },
    );
  }
  if (JSON.stringify(job).length > MAX_JOB_BYTES) {
    return NextResponse.json({ error: "Dados da vaga muito grandes." }, { status: 413 });
  }

  const profile = await loadProfileContext(supabase, user.id);
  if (!profile.summary && profile.experiences.length === 0) {
    return NextResponse.json(
      { error: "Monte seu perfil antes de gerar o e-mail." },
      { status: 400 },
    );
  }

  const context = {
    candidato: {
      nome: profile.full_name,
      headline: profile.headline,
      resumo: profile.summary,
      github: profile.github,
      site: profile.website,
      experiencias: profile.experiences,
      skills: profile.skills,
    },
    vaga: {
      empresa: job.company,
      cargo: job.role,
      modelo: job.work_model,
      skills_match: job.skills,
      estrategia: job.note,
    },
  };

  try {
    const response = await withRetry(() =>
      gemini().models.generateContent({
        model: MODEL,
        config: {
          systemInstruction: EMAIL_GENERATE_SYSTEM,
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(EmailSchema),
          thinkingConfig: THINKING,
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text:
                  "Escreva o e-mail de candidatura com base nestes dados:\n\n" +
                  JSON.stringify(context, null, 2),
              },
            ],
          },
        ],
      }),
    );

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Não consegui gerar o e-mail." },
        { status: 422 },
      );
    }

    const parsed = EmailSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "O e-mail gerado não bateu com o schema." },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (err) {
    // O status do upstream vai junto: um 400 do Gemini (config inválida) some
    // dentro da mensagem genérica e é o tipo de falha que passou despercebida.
    console.error("[email/generate]", (err as { status?: number })?.status, err);
    return NextResponse.json(
      { error: "Falha ao gerar o e-mail. Tente de novo." },
      { status: 500 },
    );
  }
}
