import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { IconPlus, IconChevronLeft, IconChevronRight } from "@/components/ui/icons";
import { TaskBoard } from "@/components/tarefas/task-board";
import type { TaskDetail } from "@/components/tarefas/types";
import type { TaskColor, TaskStatus } from "@/lib/design/tokens";
import type { TaskPriority } from "@/components/tarefas/types";

export default async function TarefasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("tasks")
    .select(
      `id, key, title, status, color, label, priority, due_at, estimate, description,
       subtasks(id, text, done, position),
       task_tags(tag),
       task_activity(id, actor, text, created_at),
       applications(company, role),
       sprints(name)`,
    )
    .eq("user_id", user.id)
    .order("position");

  const tasks: TaskDetail[] = (data ?? []).map((t) => ({
    id: t.id,
    key: t.key,
    title: t.title,
    status: t.status as TaskStatus,
    color: t.color as TaskColor,
    label: t.label,
    priority: t.priority as TaskPriority,
    due_at: t.due_at,
    estimate: t.estimate,
    description: t.description,
    sprint_name: t.sprints?.name ?? null,
    linked_company: t.applications?.company ?? null,
    linked_role: t.applications?.role ?? null,
    subtasks: (t.subtasks ?? [])
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.id, text: s.text, done: s.done })),
    tags: (t.task_tags ?? []).map((tg) => tg.tag),
    activity: (t.task_activity ?? [])
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => ({ id: a.id, actor: a.actor, text: a.text, created_at: a.created_at })),
  }));

  const done = tasks.filter((t) => t.status === "done").length;
  // Server Component: renderiza uma vez por request, então ler o relógio para
  // decidir o que está atrasado é o comportamento correto. A regra purity mira
  // Client Components que rerenderizam — falso-positivo aqui.
  // eslint-disable-next-line react-hooks/purity
  const nowMs = Date.now();
  const urgent = tasks.filter(
    (t) => t.status !== "done" && t.due_at && new Date(t.due_at).getTime() <= nowMs,
  ).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <section className="px-5 sm:px-10 pt-6 sm:pt-[34px] pb-12">
      <PageHeader eyebrow="Tarefas" title="Sua semana de busca">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 border border-border bg-surface rounded-lg px-3 py-2 shadow-flat">
            <IconChevronLeft size={15} className="text-muted" />
            <span className="font-mono text-xs text-ink font-medium">Sprint atual</span>
            <IconChevronRight size={15} className="text-muted" />
          </div>
          <button className="bg-pine text-white border-none rounded-lg px-[15px] py-2.5 text-[13px] font-semibold cursor-pointer flex items-center gap-[7px] hover:bg-pine-dark transition-colors">
            <IconPlus size={15} />
            Nova tarefa
          </button>
        </div>
      </PageHeader>

      {tasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 sm:gap-[22px] border border-border bg-surface rounded-lg px-5 py-4 mb-[22px] shadow-flat">
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-baseline justify-between mb-[9px]">
              <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-muted">
                Progresso da sprint
              </span>
              <span className="font-mono text-xs text-ink">
                {pct}% · {done} de {tasks.length}
              </span>
            </div>
            <div className="h-2 bg-subtle rounded-md overflow-hidden">
              <div
                className="h-full bg-pine rounded-md transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <Metric val={tasks.length} label="tarefas" color="#14161A" />
          <Metric val={done} label="concluídas" color="#10855F" />
          <Metric val={urgent} label="urgentes" color="#C77A16" />
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg shadow-flat px-8 py-11 text-center max-w-[440px]">
          <div className="font-display font-bold text-[17px] mb-1.5">
            Sua semana está vazia
          </div>
          <p className="text-[13px] text-muted leading-[1.55] m-0">
            Crie tarefas para organizar sua busca — estudos, follow-ups, testes técnicos.
          </p>
        </div>
      ) : (
        <TaskBoard initial={tasks} />
      )}
    </section>
  );
}

function Metric({ val, label, color }: { val: number; label: string; color: string }) {
  return (
    <div className="text-center pl-[22px] border-l border-border">
      <div className="font-mono text-[22px] font-semibold leading-none" style={{ color }}>
        {val}
      </div>
      <div className="font-mono text-[10px] tracking-[0.06em] uppercase text-muted mt-1.5">
        {label}
      </div>
    </div>
  );
}
