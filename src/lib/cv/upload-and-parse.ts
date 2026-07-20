import { createClient } from "@/lib/supabase/client";
import type { OnboardingStepKey, ParseEvent } from "@/lib/ai/schemas";
import { detectDocType, DOC_CONTENT_TYPE } from "@/lib/cv/doc-types";

/**
 * Sobe o CV ao Storage, atualiza cv_files e dispara o parse (SSE), reportando
 * cada passo via `onStep`. Compartilhado entre o onboarding e o modal do perfil
 * — os dois fluxos são idênticos, só muda a UI ao redor.
 *
 * Lança em qualquer falha (upload, insert, erro do parse). Client-side.
 */
export async function uploadAndParseCv(
  file: File,
  onStep: (step: OnboardingStepKey) => void,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Entre de novo.");

  const docType = detectDocType(file.name, file.type);
  if (!docType) throw new Error("Aceitamos PDF e DOCX.");

  // A primeira pasta é o user_id — é o que a policy do bucket checa. A extensão
  // reflete o tipo real, e é por ela que a rota de parse decide como ler.
  const path = `${user.id}/${crypto.randomUUID()}.${docType}`;

  const { error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(path, file, { contentType: DOC_CONTENT_TYPE[docType] });
  if (uploadError) throw new Error(`falha no upload: ${uploadError.message}`);

  // O CV anexado no e-mail é sempre o corrente; o índice parcial
  // cv_files_one_current garante que só exista um.
  await supabase
    .from("cv_files")
    .update({ is_current: false })
    .eq("user_id", user.id)
    .eq("is_current", true);

  const { error: insertError } = await supabase.from("cv_files").insert({
    user_id: user.id,
    storage_path: path,
    filename: file.name,
    size_bytes: file.size,
    is_current: true,
  });
  if (insertError) throw new Error(insertError.message);

  await streamParse(path, onStep);
}

async function streamParse(path: string, onStep: (step: OnboardingStepKey) => void) {
  const res = await fetch("/api/cv/parse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `erro ${res.status} ao ler o CV`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { done: finished, value } = await reader.read();
    if (finished) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE separa eventos por linha em branco; o último pedaço pode estar
    // cortado no meio, então volta para o buffer.
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const line = chunk.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;

      const event = JSON.parse(line.slice(6)) as ParseEvent;
      if (event.type === "step") {
        onStep(event.step);
      } else if (event.type === "error") {
        throw new Error(event.message);
      }
    }
  }
}
