import { NextResponse, type NextRequest } from "next/server";
import mammoth from "mammoth";
import { createClient } from "@/lib/supabase/server";
import { gemini, MODEL, toGeminiSchema, withRetry, type Part } from "@/lib/ai/gemini";
import { CV_PARSE_SYSTEM, CV_PARSE_USER } from "@/lib/ai/prompts";
import { ProfileSchema, stripEmptyScalars, type ParseEvent } from "@/lib/ai/schemas";
import { extractPdfLinkAnnotations } from "@/lib/cv/pdf-links";
import { detectDocType } from "@/lib/cv/doc-types";
import { enforceRateLimits, RateLimitError, AI_LIMITS } from "@/lib/ratelimit";

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

  const fileBuffer = Buffer.from(await blob.arrayBuffer());
  const docType = detectDocType(path, blob.type);
  if (!docType) {
    return NextResponse.json({ error: "tipo de arquivo não suportado" }, { status: 400 });
  }

  // Monta a entrada para o Gemini. PDF vai inline — o modelo lê nativamente,
  // texto e layout. DOCX é um zip binário que o modelo não interpreta, então
  // extraímos o texto com mammoth e mandamos como texto puro.
  let parts: Part[];
  try {
    if (docType === "pdf") {
      parts = [
        { inlineData: { mimeType: "application/pdf", data: fileBuffer.toString("base64") } },
        { text: CV_PARSE_USER },
      ];
    } else {
      const { value: text } = await mammoth.extractRawText({ buffer: fileBuffer });
      if (!text.trim()) {
        return NextResponse.json(
          { error: "Não consegui ler o texto do DOCX." },
          { status: 422 },
        );
      }
      parts = [{ text: `${CV_PARSE_USER}\n\n---\n${text}` }];
    }
  } catch (err) {
    console.error("[cv/parse] preparo do documento", err);
    return NextResponse.json({ error: "Falha ao ler o documento." }, { status: 400 });
  }

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
            contents: [{ role: "user", parts }],
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

        // O Gemini não lê a camada de hyperlink do PDF: se o CV traz github/
        // linkedin como ícone clicável, o modelo devolve vazio. Completamos com
        // as URLs embutidas nas anotações — só para PDF e só quando não achou.
        const profile = parsed.data;
        if (docType === "pdf") {
          const links = extractPdfLinkAnnotations(fileBuffer);
          if (!profile.github.trim() && links.github) profile.github = links.github;
          if (!profile.linkedin.trim() && links.linkedin) profile.linkedin = links.linkedin;
          if (!profile.website.trim() && links.website) profile.website = links.website;
        }

        // Transacional: ou o perfil inteiro é trocado, ou nada muda.
        // stripEmptyScalars: o CV grava só o que achou; o que não veio (github,
        // links) fica preservado se a pessoa já tinha preenchido à mão.
        const { error: saveError } = await supabase.rpc("replace_profile", {
          p_profile: stripEmptyScalars(profile),
        });
        if (saveError) throw saveError;

        send({ type: "step", step: "profile" });
        send({ type: "done" });
      } catch (err) {
        console.error("[cv/parse]", err);
        send({ type: "error", message: "Falha ao processar o CV. Tente de novo." });
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

