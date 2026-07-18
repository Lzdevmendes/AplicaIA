"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TASK_COLORS, TASK_STATUSES, type TaskColor } from "@/lib/design/tokens";
import { toggleSubtask, setTaskColor } from "@/app/(app)/tarefas/actions";
import {
  IconClose,
  IconCalendar,
  IconCheck,
  IconTracker,
  IconChevronRight,
  IconPlus,
} from "@/components/ui/icons";
import { priorityStyle, PRIORITY_LABEL, labelStyle, dueLabel } from "./task-styles";
import type { TaskDetail } from "./types";

const PROP_KEY = "font-mono text-[11px] text-faint";

export function TaskDrawer({
  task,
  onClose,
  onLocalChange,
}: {
  task: TaskDetail;
  onClose: () => void;
  onLocalChange: (t: TaskDetail) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const c = TASK_COLORS[task.color];
  const st = TASK_STATUSES[task.status];
  const due = dueLabel(task.due_at);
  const doneCount = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  async function onToggleSub(subId: string, current: boolean) {
    // Otimista: atualiza o drawer e o card já; reverte se o servidor recusar.
    const next = {
      ...task,
      subtasks: task.subtasks.map((s) => (s.id === subId ? { ...s, done: !current } : s)),
    };
    onLocalChange(next);
    const res = await toggleSubtask(subId, !current);
    if (res?.error) onLocalChange(task);
    else router.refresh();
  }

  async function onPickColor(key: TaskColor) {
    if (key === task.color) return;
    onLocalChange({ ...task, color: key });
    const res = await setTaskColor(task.id, key);
    if (res?.error) onLocalChange(task);
    else router.refresh();
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/30 z-[60] vp-settle"
        style={{ animationDuration: "0.2s" }}
      />
      <aside
        className="vp-scroll vp-drawer fixed top-0 right-0 h-screen w-[480px] max-w-[92vw] bg-surface border-l border-border shadow-drawer z-[61] overflow-y-auto"
        role="dialog"
        aria-label={`Tarefa ${task.key}`}
      >
        <div className="sticky top-0 bg-surface border-b border-border px-[22px] py-4 flex items-center gap-2.5 z-[2]">
          {task.label && <span style={labelStyle(c.t, c.b)}>{task.label}</span>}
          <span className="font-mono text-[11px] text-faint">{task.key}</span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="ml-auto w-8 h-8 border-none bg-bg rounded-lg text-muted cursor-pointer flex items-center justify-center hover:bg-subtle hover:text-ink transition-colors"
          >
            <IconClose size={16} />
          </button>
        </div>

        <div className="p-[22px]">
          <h2 className="font-display font-extrabold text-[22px] leading-[1.2] tracking-[-0.01em] m-0 mb-[18px] text-ink">
            {task.title}
          </h2>

          {/* Propriedades */}
          <div className="grid grid-cols-[96px_1fr] gap-x-3.5 gap-y-3 items-center mb-[22px]">
            <span className={PROP_KEY}>Status</span>
            <span className="flex items-center gap-2">
              <span
                aria-hidden
                className="w-2 h-2 rounded-full flex-none"
                style={{ background: st.color }}
              />
              <span className="text-[13px] font-medium text-ink">{st.name}</span>
            </span>

            <span className={PROP_KEY}>Prioridade</span>
            <span>
              <span style={priorityStyle(task.priority)}>{PRIORITY_LABEL[task.priority]}</span>
            </span>

            <span className={PROP_KEY}>Prazo</span>
            <span
              className="flex items-center gap-1.5 font-mono text-[12.5px]"
              style={{ color: due.urgent ? "#C77A16" : "#6B7076" }}
            >
              <IconCalendar size={13} />
              {due.text}
            </span>

            {task.estimate && (
              <>
                <span className={PROP_KEY}>Estimativa</span>
                <span className="font-mono text-[12.5px] text-ink">{task.estimate}</span>
              </>
            )}

            {task.sprint_name && (
              <>
                <span className={PROP_KEY}>Sprint</span>
                <span className="font-mono text-[12.5px] text-ink">{task.sprint_name}</span>
              </>
            )}
          </div>

          {/* Cor e etiqueta */}
          <Section title="Cor e etiqueta">
            <div className="flex items-center gap-[9px]">
              {(Object.keys(TASK_COLORS) as TaskColor[]).map((key) => {
                const cc = TASK_COLORS[key];
                const active = key === task.color;
                return (
                  <button
                    key={key}
                    onClick={() => onPickColor(key)}
                    title={cc.name}
                    aria-label={cc.name}
                    aria-pressed={active}
                    className="w-[26px] h-[26px] rounded-full cursor-pointer flex items-center justify-center p-0 transition-transform hover:scale-105"
                    style={{
                      background: cc.dot,
                      border: active ? "2px solid #14161A" : "1px solid rgba(0,0,0,.08)",
                    }}
                  >
                    {active && <IconCheck size={12} strokeWidth={3} />}
                  </button>
                );
              })}
              <span className="ml-1 font-mono text-xs text-muted">{c.name}</span>
            </div>
          </Section>

          {task.description && (
            <Section title="Descrição">
              <p className="m-0 text-[13.5px] leading-[1.65] text-text2 whitespace-pre-line">
                {task.description}
              </p>
            </Section>
          )}

          {total > 0 && (
            <Section title="Subtarefas" right={`${doneCount}/${total}`}>
              <div className="h-1.5 bg-subtle rounded-md overflow-hidden mb-[13px]">
                <div
                  className="h-full bg-pine rounded-md transition-[width] duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex flex-col gap-[3px]">
                {task.subtasks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onToggleSub(s.id, s.done)}
                    className="flex items-center gap-2.5 px-2 py-[7px] border-none bg-transparent rounded-[7px] cursor-pointer text-left w-full hover:bg-bg transition-colors"
                  >
                    <span
                      className="w-[18px] h-[18px] rounded-[5px] flex-none flex items-center justify-center"
                      style={
                        s.done
                          ? { background: "#10855F", border: "1px solid #10855F" }
                          : { background: "#fff", border: "1.5px solid #D8D5CD" }
                      }
                    >
                      {s.done && <IconCheck size={11} strokeWidth={3.2} />}
                    </span>
                    <span
                      className="text-[13.5px]"
                      style={
                        s.done
                          ? { color: "#9a9ea3", textDecoration: "line-through" }
                          : { color: "#2a2d33" }
                      }
                    >
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            </Section>
          )}

          {task.tags.length > 0 && (
            <Section title="Etiquetas">
              <div className="flex flex-wrap gap-[7px]">
                {task.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[11px] text-muted bg-bg border border-border rounded-md px-[9px] py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {task.linked_company && (
            <Section title="Candidatura vinculada">
              <div className="w-full flex items-center gap-3 bg-bg border border-border rounded-lg px-3.5 py-3 text-left">
                <span className="w-[34px] h-[34px] rounded-lg bg-pine-tint text-pine flex items-center justify-center flex-none">
                  <IconTracker size={16} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-display font-bold text-sm text-ink">
                    {task.linked_company}
                  </span>
                  {task.linked_role && (
                    <span className="block text-[12.5px] text-muted">{task.linked_role}</span>
                  )}
                </span>
                <IconChevronRight size={16} className="text-faint" />
              </div>
            </Section>
          )}

          <Section title="Atividade" last>
            <div className="flex flex-col gap-[15px]">
              {task.activity.length === 0 && (
                <span className="text-[13px] text-faint">Sem atividade ainda.</span>
              )}
              {task.activity.map((a) => (
                <div key={a.id} className="flex gap-[11px]">
                  <span
                    className="w-[26px] h-[26px] rounded-full font-mono text-[10px] flex items-center justify-center flex-none"
                    style={
                      a.actor === "ai"
                        ? { background: "#E7F3EE", color: "#10855F" }
                        : { background: "#14161A", color: "#E7F3EE" }
                    }
                  >
                    {a.actor === "ai" ? "AI" : "LM"}
                  </span>
                  <div className="flex-1">
                    <div className="text-[13px] leading-[1.5] text-text2">
                      <span className="font-semibold text-ink">
                        {a.actor === "ai" ? "AplicaAI" : "Você"}
                      </span>{" "}
                      {a.text}
                    </div>
                    <div className="font-mono text-[10.5px] text-faint mt-0.5">
                      {relative(a.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 mt-4">
              <span className="w-[26px] h-[26px] rounded-full bg-ink text-pine-tint font-mono text-[10px] flex items-center justify-center flex-none">
                LM
              </span>
              <input
                placeholder="Escreva um comentário…"
                className="flex-1 border border-border rounded-lg px-3 py-[9px] text-[13px] outline-none bg-bg focus:border-pine focus:bg-surface"
              />
            </div>
          </Section>

          <button className="mt-2 flex items-center gap-[7px] px-2 py-[7px] border-none bg-transparent text-faint text-[12.5px] cursor-pointer rounded-[7px] hover:text-pine transition-colors">
            <IconPlus size={13} />
            Adicionar subtarefa
          </button>
        </div>
      </aside>
    </>
  );
}

function Section({
  title,
  right,
  last = false,
  children,
}: {
  title: string;
  right?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`border-t border-subtle pt-4 ${last ? "" : "mb-5"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[10.5px] tracking-[0.1em] uppercase text-muted">
          {title}
        </div>
        {right && <div className="font-mono text-[11px] text-pine">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function relative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "agora há pouco";
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "há 1 dia" : `há ${d} dias`;
}
