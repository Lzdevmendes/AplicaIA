"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/db/types";

type Status = Database["public"]["Enums"]["application_status"];

const VALID: Status[] = [
  "rascunho",
  "enviada",
  "em_processo",
  "entrevista",
  "oferta",
  "sem_retorno",
];

/**
 * Move a candidatura para outra coluna.
 *
 * Ajusta os timestamps que alimentam as métricas: sair de rascunho carimba
 * applied_at (sem isso a candidatura nunca conta como enviada); entrar em
 * processo/entrevista/oferta carimba responded_at (é o que dá a taxa de
 * resposta). Não apaga um timestamp já existente ao voltar para trás — o
 * histórico de que houve resposta continua valendo.
 */
export async function moveApplication(id: string, status: Status) {
  if (!VALID.includes(status)) {
    return { error: "status inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "não autenticado" };

  const { data: current } = await supabase
    .from("applications")
    .select("applied_at, responded_at")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "candidatura não encontrada" };

  const patch: Database["public"]["Tables"]["applications"]["Update"] = { status };

  if (status !== "rascunho" && !current.applied_at) {
    patch.applied_at = new Date().toISOString();
  }
  if (
    ["em_processo", "entrevista", "oferta"].includes(status) &&
    !current.responded_at
  ) {
    patch.responded_at = new Date().toISOString();
  }

  // A RLS garante que o update só alcança as linhas do próprio usuário.
  const { error } = await supabase.from("applications").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tracker");
  return { ok: true };
}
