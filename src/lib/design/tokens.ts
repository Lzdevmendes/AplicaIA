/**
 * Tokens extraídos do protótipo do Claude Design (AplicaAI.dc.html).
 * Os valores aqui são a especificação visual — não alterar sem conferir o protótipo.
 */

export const color = {
  bg: "#FBFAF7",
  surface: "#FFFFFF",
  column: "#F5F3EE",
  subtle: "#F1EFEA",
  border: "#E7E5DF",
  border2: "#D8D5CD",
  border3: "#C9C6BF",
  ink: "#14161A",
  text2: "#2a2d33",
  muted: "#6B7076",
  faint: "#9a9ea3",
  pine: "#10855F",
  pineDark: "#0c6a4b",
  pineTint: "#E7F3EE",
  amber: "#C77A16",
  blue: "#3a6ea5",
  plum: "#7d5ba6",
  clay: "#b0563a",
  /** Texto sobre o card escuro do match de skills */
  onInk: "#E7E5DF",
  onInkMuted: "#8b9298",
} as const;

/** Paleta do seletor de cor da tarefa. `t` = texto, `b` = fundo, `dot` = bolinha/acento. */
export const TASK_COLORS = {
  pine: { t: "#10855F", b: "#E7F3EE", dot: "#10855F", name: "Pinho" },
  amber: { t: "#C77A16", b: "rgba(199,122,22,.12)", dot: "#C77A16", name: "Âmbar" },
  blue: { t: "#3a6ea5", b: "rgba(58,110,165,.12)", dot: "#3a6ea5", name: "Azul" },
  plum: { t: "#7d5ba6", b: "rgba(125,91,166,.13)", dot: "#7d5ba6", name: "Ameixa" },
  clay: { t: "#b0563a", b: "rgba(176,86,58,.12)", dot: "#b0563a", name: "Argila" },
  slate: { t: "#6B7076", b: "#F1EFEA", dot: "#9a9ea3", name: "Cinza" },
} as const;

export type TaskColor = keyof typeof TASK_COLORS;

/** Colunas do kanban de tarefas. */
export const TASK_STATUSES = {
  backlog: { name: "Backlog", color: "#9a9ea3" },
  todo: { name: "A fazer", color: "#C77A16" },
  doing: { name: "Em progresso", color: "#3a6ea5" },
  done: { name: "Concluído", color: "#10855F" },
} as const;

export type TaskStatus = keyof typeof TASK_STATUSES;

/** Colunas do tracker de candidaturas. */
export const APPLICATION_STATUSES = {
  rascunho: { name: "Rascunho", color: "#9a9ea3" },
  enviada: { name: "Enviada", color: "#10855F" },
  em_processo: { name: "Em processo", color: "#C77A16" },
  entrevista: { name: "Entrevista", color: "#10855F" },
  oferta: { name: "Oferta", color: "#10855F" },
  sem_retorno: { name: "Sem retorno", color: "#9a9ea3" },
} as const;

export type ApplicationStatus = keyof typeof APPLICATION_STATUSES;

export const size = {
  rail: 76,
  drawer: 480,
  trackerColumn: 270,
  taskColumn: 290,
} as const;

export const radius = {
  chip: 6,
  card: 8,
  column: 10,
  rail: 11,
  hero: 14,
} as const;

export const shadow = {
  card: "0 1px 2px rgba(20,22,26,.04), 0 6px 16px rgba(20,22,26,.03)",
  flat: "0 1px 2px rgba(20,22,26,.04)",
  ink: "0 1px 2px rgba(20,22,26,.06), 0 8px 24px rgba(20,22,26,.10)",
  hover: "0 4px 14px rgba(20,22,26,.08)",
  drawer: "-12px 0 40px rgba(20,22,26,.12)",
} as const;
