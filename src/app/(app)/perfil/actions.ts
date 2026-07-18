"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { EditableProfileSchema, type EditableProfile } from "@/lib/ai/edit-schema";
import type { Json } from "@/lib/db/types";

/**
 * Grava a edição manual do perfil. Envia todos os campos → a RPC
 * replace_profile grava tudo (edição é autoritativa, inclusive limpar).
 * Sujeito à RLS: a função grava só no perfil do usuário logado.
 */
export async function saveProfile(profile: EditableProfile) {
  const parsed = EditableProfileSchema.safeParse(profile);
  if (!parsed.success) {
    return { error: "perfil inválido" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "não autenticado" };

  const { error } = await supabase.rpc("replace_profile", {
    p_profile: parsed.data as unknown as Json,
  });
  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { ok: true };
}
