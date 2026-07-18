import type { CSSProperties } from "react";
import type { TaskPriority } from "./types";

/** Chip de prioridade, cores do protótipo. */
export function priorityStyle(p: TaskPriority): CSSProperties {
  const base: CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    borderRadius: 4,
    padding: "2px 7px",
  };
  if (p === "alta") return { ...base, color: "#C77A16", background: "rgba(199,122,22,.12)" };
  if (p === "media") return { ...base, color: "#3a6ea5", background: "rgba(58,110,165,.1)" };
  if (p === "feito") return { ...base, color: "#10855F", background: "#E7F3EE" };
  return { ...base, color: "#6B7076", background: "#F1EFEA" }; // baixa
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  alta: "alta",
  media: "média",
  baixa: "baixa",
  feito: "feito",
};

/** Chip de etiqueta, tingido pela cor da tarefa. */
export function labelStyle(colorText: string, colorBg: string): CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: 9.5,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontWeight: 500,
    color: colorText,
    background: colorBg,
    borderRadius: 4,
    padding: "2px 7px",
  };
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export function dueLabel(iso: string | null): { text: string; urgent: boolean } {
  if (!iso) return { text: "sem prazo", urgent: false };
  // due_at é uma `date` (YYYY-MM-DD). new Date("2026-07-10") assume meia-noite
  // UTC, e num fuso negativo (Brasil, UTC-3) getDate() cai para o dia anterior.
  // Parsear os componentes gera um Date local, sem esse shift.
  const [y, mo, dy] = iso.slice(0, 10).split("-").map(Number);
  const d = new Date(y, mo - 1, dy);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d);
  due.setHours(0, 0, 0, 0);
  const isToday = due.getTime() === today.getTime();
  const urgent = due.getTime() <= today.getTime();
  const text = isToday ? "hoje" : `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]}`;
  return { text, urgent };
}
