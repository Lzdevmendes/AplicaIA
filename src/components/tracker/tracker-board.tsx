"use client";

import { useState } from "react";
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
import { moveApplication } from "@/app/(app)/tracker/actions";
import { APPLICATION_STATUSES, type ApplicationStatus } from "@/lib/design/tokens";

export type AppCard = {
  id: string;
  company: string;
  role: string | null;
  source: string | null;
  status: ApplicationStatus;
  applied_at: string | null;
  follow_up_at: string | null;
};

const COLUMN_ORDER: ApplicationStatus[] = [
  "rascunho",
  "enviada",
  "em_processo",
  "entrevista",
  "oferta",
  "sem_retorno",
];

const EMPTY_MSG: Partial<Record<ApplicationStatus, string>> = {
  oferta: "Nenhuma oferta ainda. Você chega lá.",
  entrevista: "Nenhuma entrevista marcada.",
};

export function TrackerBoard({ initial }: { initial: AppCard[] }) {
  const [cards, setCards] = useState(initial);
  const [dragging, setDragging] = useState<AppCard | null>(null);

  const sensors = useSensors(
    // distance evita que um clique simples no card vire drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const byStatus = (s: ApplicationStatus) => cards.filter((c) => c.status === s);

  function onDragStart(e: DragStartEvent) {
    setDragging(cards.find((c) => c.id === e.active.id) ?? null);
  }

  async function onDragEnd(e: DragEndEvent) {
    setDragging(null);
    const id = String(e.active.id);
    const target = e.over?.id as ApplicationStatus | undefined;
    if (!target) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.status === target) return;

    // Otimista: move na UI já; reverte se o servidor recusar.
    const previous = card.status;
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: target } : c)));

    const res = await moveApplication(id, target);
    if (res?.error) {
      setCards((cs) => cs.map((c) => (c.id === id ? { ...c, status: previous } : c)));
    }
  }

  return (
    <DndContext
      id="tracker"
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="vp-scroll flex gap-4 overflow-x-auto pb-3 items-start">
        {COLUMN_ORDER.map((status) => (
          <Column
            key={status}
            status={status}
            cards={byStatus(status)}
            emptyMsg={EMPTY_MSG[status]}
          />
        ))}
      </div>

      <DragOverlay>
        {dragging ? <Card card={dragging} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  status,
  cards,
  emptyMsg,
}: {
  status: ApplicationStatus;
  cards: AppCard[];
  emptyMsg?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = APPLICATION_STATUSES[status];

  return (
    <div
      ref={setNodeRef}
      className={[
        "flex-none w-[270px] border rounded-[10px] p-3 transition-colors",
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
        <span className="ml-auto font-mono text-[11px] text-muted">{cards.length}</span>
      </div>

      <div className="flex flex-col gap-[9px]">
        {cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
        {cards.length === 0 && emptyMsg && (
          <div className="border-[1.5px] border-dashed border-border2 rounded-lg px-3 py-[18px] text-center text-xs text-faint leading-[1.4]">
            {emptyMsg}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ card, overlay = false }: { card: AppCard; overlay?: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    disabled: overlay,
  });

  const follow = followChip(card);

  return (
    <div
      ref={setNodeRef}
      {...(overlay ? {} : listeners)}
      {...(overlay ? {} : attributes)}
      className={[
        "bg-surface border border-border rounded-lg px-3.5 py-[13px] shadow-flat cursor-grab",
        "transition-[transform,box-shadow] duration-100",
        overlay ? "shadow-hover cursor-grabbing" : "hover:-translate-y-0.5 hover:shadow-hover",
        isDragging ? "opacity-40" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2 mb-[5px]">
        <span className="font-display font-bold text-[14.5px] text-ink">
          {card.company}
        </span>
        {card.source && (
          <span className="font-mono text-[10px] text-muted bg-bg border border-border rounded px-1.5 py-0.5">
            {card.source}
          </span>
        )}
      </div>
      {card.role && (
        <div className="text-[13px] text-text2 mb-[11px] leading-[1.35]">{card.role}</div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10.5px] text-faint">{shortDate(card.applied_at)}</span>
        {follow && <span style={follow.style}>{follow.label}</span>}
      </div>
    </div>
  );
}

function followChip(card: AppCard): { label: string; style: React.CSSProperties } | null {
  if (!card.follow_up_at) return null;
  const due = new Date(card.follow_up_at);
  const overdue = due.getTime() <= Date.now();
  const label = `follow-up ${shortDate(card.follow_up_at)}`;

  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    borderRadius: 4,
    padding: "2px 6px",
  };
  return overdue
    ? {
        label,
        style: {
          ...base,
          color: "#C77A16",
          background: "rgba(199,122,22,.12)",
          border: "1px solid rgba(199,122,22,.28)",
        },
      }
    : { label, style: { ...base, color: "#9a9ea3" } };
}

function shortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${String(d.getDate()).padStart(2, "0")} ${meses[d.getMonth()]}`;
}
