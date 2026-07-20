import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gemini, MODEL, toGeminiSchema, withRetry, type Part } from "@/lib/ai/gemini";
import { loadProfileContext } from "@/lib/db/profile";
import {
  jobExtractSystem,
  JOB_EXTRACT_USER_TEXT,
  JOB_EXTRACT_USER_IMAGE,
} from "@/lib/ai/prompts";
import { JobExtractionSchema } from "@/lib/ai/job-schemas";
import { enforceRateLimits, RateLimitError, AI_LIMITS } from "@/lib/ratelimit";

export const maxDuration = 60;

const IMAGE_MEDIA = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type ImageMedia = (typeof IMAGE_MEDIA)[number];

// Caps de entrada: protegem memória e a cota do Gemini contra payloads abusivos.
const MAX_JOB_TEXT = 20_000; // caracteres
const MAX_IMAGE_B64 = 7_000_000; // ~5 MB de imagem em base64

/**
 * Recebe o texto ou o print de uma vaga e devolve os metadados + o match de
 * skills contra o perfil, numa chamada só ao Gemini.
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
  const jobText: string | undefined = body?.text;
  const imageData: string | undefined = body?.imageBase64;
  const imageMedia: string | undefined = body?.imageMediaType;

  if (typeof jobText === "string" && jobText.length > MAX_JOB_TEXT) {
    return NextResponse.json({ error: "Texto da vaga muito longo." }, { status: 413 });
  }
  if (typeof imageData === "string" && imageData.length > MAX_IMAGE_B64) {
    return NextResponse.json({ error: "Imagem muito grande (máx. ~5 MB)." }, { status: 413 });
  }

  let parts: Part[];

  if (typeof jobText === "string" && jobText.trim().length > 0) {
    parts = [{ text: `${JOB_EXTRACT_USER_TEXT}\n\n---\n${jobText}` }];
  } else if (imageData && IMAGE_MEDIA.includes(imageMedia as ImageMedia)) {
    parts = [
      { inlineData: { mimeType: imageMedia as ImageMedia, data: imageData } },
      { text: JOB_EXTRACT_USER_IMAGE },
    ];
  } else {
    return NextResponse.json(
      { error: "envie o texto da vaga ou um print válido" },
      { status: 400 },
    );
  }

  const profile = await loadProfileContext(supabase, user.id);

  try {
    const response = await withRetry(() =>
      gemini().models.generateContent({
        model: MODEL,
        config: {
          systemInstruction: jobExtractSystem(profile.skills),
          responseMimeType: "application/json",
          responseJsonSchema: toGeminiSchema(JobExtractionSchema),
          // Desliga o raciocínio do flash novo — sem isto a chamada estoura o
          // tempo da função na Vercel (ver gemini.ts / rota cv/parse).
          thinkingConfig: { thinkingBudget: 0 },
        },
        contents: [{ role: "user", parts }],
      }),
    );

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Não consegui extrair os dados da vaga." },
        { status: 422 },
      );
    }

    const parsed = JobExtractionSchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Os dados extraídos não bateram com o schema." },
        { status: 422 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (err) {
    console.error("[job/extract]", err);
    return NextResponse.json(
      { error: "Falha ao ler a vaga. Tente de novo." },
      { status: 500 },
    );
  }
}
