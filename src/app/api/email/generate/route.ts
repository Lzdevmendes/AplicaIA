import { gemini, MODEL, toGeminiSchema, withRetry } from "@/lib/ai/gemini";
import { EmailSchema } from "@/lib/ai/job-schemas";
import { EMAIL_GENERATE_SYSTEM } from "@/lib/ai/prompts";
import { loadProfileContext } from "@/lib/db/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export const maxDuration = 60;

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

  const body = await request.json().catch(() => null);
  const job = body?.job;
  if (!job || typeof job.company !== "string") {
    return NextResponse.json(
      { error: "dados da vaga ausentes" },
      { status: 400 },
    );
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
    console.error("[email/generate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "falha ao gerar o e-mail" },
      { status: 500 },
    );
  }
}
