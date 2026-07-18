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

export const maxDuration = 60;

const IMAGE_MEDIA = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type ImageMedia = (typeof IMAGE_MEDIA)[number];

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

  const body = await request.json().catch(() => null);
  const jobText: string | undefined = body?.text;
  const imageData: string | undefined = body?.imageBase64;
  const imageMedia: string | undefined = body?.imageMediaType;

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
      { error: err instanceof Error ? err.message : "falha ao extrair a vaga" },
      { status: 500 },
    );
  }
}
