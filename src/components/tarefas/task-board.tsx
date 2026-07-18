"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { TASK_STATUSES, TASK_COLORS, type TaskStatus } from "@/lib/design/tokens";
import { moveTask } from "@/app/(app)/tarefas/actions";
import { IconPlus, IconCalendar, IconChecklist } from "@/components/ui/icons";
import { TaskDrawer } from "./task-drawer";
import { priorityStyle, PRIORITY_LABEL, labelStyle, dueLabel } from "./task-styles";
import type { TaskDetail } from "./types";

const COLUMN_ORDER: TaskStatus[] = ["backlog", "todo", "doing", "done"];

export function TaskBoard({ initial }: { initial: TaskDetail[] }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initial);
  const [openId, setOpenId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<TaskDetail | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = (s: TaskStatus) => tasks.filter((t) => t.status === s);
  const open = tasks.find((t) => t.id === openId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setDragging(tasks.find((t) => t.id === e.active.id) ?? null);
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const id = String(e.active.id);
    const target = e.over?.id as TaskStatus | undefined;
    if (!target) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === target) return;

    const previous = task.status;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: target } : t)));
    const res = await moveTask(id, target);
    if (res?.error) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: previous } : t)));
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <DndContext
        id="tarefas"
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="vp-scroll flex gap-4 overflow-x-auto pb-3 items-start">
          {COLUMN_ORDER.map((status) => (
            <Column
              key={status}
              status={status}
              tasks={byStatus(status)}
              onOpen={setOpenId}
            />
          ))}
        </div>

        <DragOverlay>{dragging ? <Card task={dragging} overlay /> : null}</DragOverlay>
      </DndContext>

      {open && (
        <TaskDrawer
          task={open}
          onClose={() => setOpenId(null)}
          onLocalChange={(next) =>
            setTasks((ts) => ts.map((t) => (t.id === next.id ? next : t)))
          }
        />
      )}
    </>
  );
}

function Column({
  status,
  tasks,
  onOpen,
}: {
  status: TaskStatus;
  tasks: TaskDetail[];
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = TASK_STATUSES[status];

  return (
    <div
      ref={setNodeRef}
      data-testid={`task-column-${status}`}
      className={[
        "flex-none w-[290px] border rounded-[10px] p-3 transition-colors",
        isOver ? "bg-pine-tint border-pine" : "bg-column border-border",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-3">
        <span
          aria-hidden
          className="w-2 h-2 rounded-full flex-none"
          style={{ background: meta.color }}
        />
        <span className="font-mono text-[11px] tracking-[0.06em] uppercase text-ink font-medium">
          {meta.name}
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted">{tasks.length}</span>
      </div>

      <div className="flex flex-col gap-[9px]">
        {tasks.map((task) => (
          <Card key={task.id} task={task} onOpen={onOpen} />
        ))}
        <button className="border-[1.5px] border-dashed border-border2 bg-transparent rounded-lg p-2.5 text-xs text-faint cursor-pointer flex items-center justify-center gap-1.5 w-full hover:border-pine hover:text-pine transition-colors">
          <IconPlus size={13} />
          Adicionar
        </button>
      </div>
    </div>
  );
}

function Card({
  task,
  onOpen,
  overlay = false,
}: {
  task: TaskDetail;
  onOpen?: (id: string) => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    disabled: overlay,
  });

  const c = TASK_COLORS[task.color];
  const done = task.subtasks.filter((s) => s.done).length;
  const total = task.subtasks.length;
  const due = dueLabel(task.due_at);
  const struck = task.priority === "feito";

  return (
    <div
      ref={setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      data-testid={overlay ? undefined : "task-card"}
      data-task-key={task.key}
      onClick={() => !isDragging && onOpen?.(task.id)}
      className={[
        "relative bg-surface border border-border rounded-lg pl-[15px] pr-[13px] py-3 shadow-flat cursor-pointer overflow-hidden",
        "transition-[transform,box-shadow] duration-100",
        overlay ? "shadow-hover" : "hover:-translate-y-0.5 hover:shadow-hover",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: c.dot }}
      />
      <div className="flex items-center gap-[7px] mb-2">
        {task.label && <span style={labelStyle(c.t, c.b)}>{task.label}</span>}
        <span className="ml-auto font-mono text-[10px] text-faint">{task.key}</span>
      </div>

      <div
        className="text-[13.5px] text-ink leading-[1.4] font-[450]"
        style={struck ? { textDecoration: "line-through", color: "#9a9ea3" } : undefined}
      >
        {task.title}
      </div>

      {total > 0 && (
        <div className="flex items-center gap-[7px] mt-2.5">
          <IconChecklist size={13} className="text-muted" />
          <span className="font-mono text-[10.5px] text-muted">
            {done}/{total}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-[11px] pt-2.5 border-t border-subtle">
        <span style={priorityStyle(task.priority)}>{PRIORITY_LABEL[task.priority]}</span>
        <span
          className="ml-auto flex items-center gap-[5px] font-mono text-[10.5px]"
          style={{ color: due.urgent ? "#C77A16" : "#9a9ea3" }}
        >
          <IconCalendar size={12} />
          {due.text}
        </span>
      </div>
    </div>
  );
}
