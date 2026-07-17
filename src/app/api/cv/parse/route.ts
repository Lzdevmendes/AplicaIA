import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gemini, MODEL, toGeminiSchema, withRetry } from "@/lib/ai/gemini";
import { CV_PARSE_SYSTEM, CV_PARSE_USER } from "@/lib/ai/prompts";
import { ProfileSchema, stripEmptyScalars, type ParseEvent } from "@/lib/ai/schemas";

export const maxDuration = 120;

/**
 * Lê o CV do Storage, extrai o perfil com o Gemini e grava no banco.
 *
 * Responde em SSE porque o parse leva dezenas de segundos e a tela de
 * onboarding acende um passo por vez. Os passos são disparados quando os
 * campos correspondentes aparecem de fato no stream do modelo — a ordem vem
 * de ProfileSchema.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { path } = await request.json().catch(() => ({ path: null }));
  if (typeof path !== "string" || !path) {
    return NextResponse.json({ error: "path do CV ausente" }, { status: 400 });
  }

  // A RLS do bucket já barra path de outro usuário, mas checar aqui evita
  // gastar um download para descobrir isso.
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "path não pertence ao usuário" }, { status: 403 });
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from("cvs")
    .download(path);

  if (downloadError || !blob) {
    return NextResponse.json(
      { error: `não consegui ler o CV: ${downloadError?.message ?? "arquivo vazio"}` },
      { status: 400 },
    );
  }

  const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: ParseEvent) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

      try {
        const responseStream = await withRetry(() =>
          gemini().models.generateContentStream({
            model: MODEL,
            config: {
              systemInstruction: CV_PARSE_SYSTEM,
              responseMimeType: "application/json",
              responseJsonSchema: toGeminiSchema(ProfileSchema),
            },
            contents: [
              {
                role: "user",
                parts: [
                  { inlineData: { mimeType: "application/pdf", data: base64 } },
                  { text: CV_PARSE_USER },
                ],
              },
            ],
          }),
        );

        // O JSON chega na ordem do schema: quando uma chave aparece, a anterior
        // terminou. É isso que move a barra, não um timer.
        let buffer = "";
        const fired = new Set<string>();
        const fire = (step: "read" | "experiences" | "skills") => {
          if (!fired.has(step)) {
            fired.add(step);
            send({ type: "step", step });
          }
        };

        for await (const chunk of responseStream) {
          const delta = chunk.text ?? "";
          if (!delta) continue;
          buffer += delta;
          fire("read");
          if (buffer.includes('"skills"')) fire("experiences");
          if (buffer.includes('"education"')) fire("skills");
        }

        if (!buffer.trim()) {
          send({ type: "error", message: "O modelo não retornou o perfil." });
          controller.close();
          return;
        }

        const parsed = ProfileSchema.safeParse(JSON.parse(buffer));
        if (!parsed.success) {
          send({ type: "error", message: "O perfil extraído não bateu com o schema." });
          controller.close();
          return;
        }

        // Transacional: ou o perfil inteiro é trocado, ou nada muda.
        // stripEmptyScalars: o CV grava só o que achou; o que não veio (github,
        // links) fica preservado se a pessoa já tinha preenchido à mão.
        const { error: saveError } = await supabase.rpc("replace_profile", {
          p_profile: stripEmptyScalars(parsed.data),
        });
        if (saveError) throw saveError;

        send({ type: "step", step: "profile" });
        send({ type: "done" });
      } catch (err) {
        console.error("[cv/parse]", err);
        send({
          type: "error",
          message: err instanceof Error ? err.message : "falha ao processar o CV",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

