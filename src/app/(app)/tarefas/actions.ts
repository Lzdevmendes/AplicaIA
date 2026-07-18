"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/db/types";
import { TASK_STATUSES, TASK_COLORS } from "@/lib/design/tokens";

type Status = Database["public"]["Enums"]["task_status"];
type Color = Database["public"]["Enums"]["task_color"];

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Move a tarefa entre colunas do kanban e registra na atividade. */
export async function moveTask(id: string, status: Status) {
  if (!(status in TASK_STATUSES)) return { error: "status inválido" };
  const { supabase, user } = await authed();
  if (!user) return { error: "não autenticado" };

  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("task_activity").insert({
    user_id: user.id,
    task_id: id,
    actor: "user",
    text: `moveu para ${TASK_STATUSES[status].name}`,
  });

  revalidatePath("/tarefas");
  return { ok: true };
}

/** Liga/desliga uma subtarefa. */
export async function toggleSubtask(subtaskId: string, done: boolean) {
  const { supabase, user } = await authed();
  if (!user) return { error: "não autenticado" };

  const { error } = await supabase
    .from("subtasks")
    .update({ done })
    .eq("id", subtaskId);
  if (error) return { error: error.message };

  revalidatePath("/tarefas");
  return { ok: true };
}

/** Troca a cor/etiqueta de cor da tarefa. */
export async function setTaskColor(id: string, color: Color) {
  if (!(color in TASK_COLORS)) return { error: "cor inválida" };
  const { supabase, user } = await authed();
  if (!user) return { error: "não autenticado" };

  const { error } = await supabase.from("tasks").update({ color }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/tarefas");
  return { ok: true };
}
