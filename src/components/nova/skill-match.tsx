"use client";

import type { JobExtraction } from "@/lib/ai/job-schemas";

type Verdict = JobExtraction["skills"][number]["verdict"];

const DOT: Record<Verdict, string> = {
  match: "#10855F",
  partial: "#C77A16",
  miss: "#4a4e54",
};

const MARK: Record<Verdict, string> = {
  match: "bate",
  partial: "parcial",
  miss: "faltando",
};

function tagStyle(v: Verdict): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    borderRadius: 4,
    padding: "2px 6px",
  };
  if (v === "match")
    return { ...base, color: "#10855F", background: "rgba(16,133,95,.16)" };
  if (v === "partial")
    return { ...base, color: "#C77A16", background: "rgba(199,122,22,.16)" };
  return { ...base, color: "#8b9298", background: "rgba(255,255,255,.06)" };
}

/**
 * O card escuro de match de skills — a assinatura visual da tela.
 * Sempre visível; durante a geração mostra a barra de varredura (vpSweep).
 */
export function SkillMatch({
  skills,
  note,
  generating,
}: {
  skills: JobExtraction["skills"];
  note: string | null;
  generating: boolean;
}) {
  const matched = skills.filter((s) => s.verdict === "match").length;
  const readout = skills.length ? `${matched}/${skills.length} batem` : "—";

  return (
    <div className="relative overflow-hidden rounded-lg bg-ink px-5 pt-[18px] pb-4 shadow-ink">
      <div className="flex items-baseline justify-between mb-3.5">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-[#8b9298]">
          Match de skills
        </div>
        <div className="font-mono text-[11px] text-pine">{readout}</div>
      </div>

      {generating && (
        <div className="h-0.5 bg-white/[0.06] rounded-sm relative overflow-hidden mb-3.5">
          <div className="vp-sweep" />
        </div>
      )}

      {skills.length === 0 ? (
        <p className="text-xs text-[#8b9298] leading-[1.5] py-4">
          Cole a vaga ao lado e clique em gerar. O match aparece aqui.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[26px] gap-y-[7px]">
          {skills.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="vp-row-in flex items-center gap-2.5 py-[3px]"
            >
              <span
                aria-hidden
                className="w-2 h-2 rounded-full flex-none"
                style={{ background: DOT[s.verdict] }}
              />
              <span className="font-mono text-[12.5px] text-border flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {s.name}
              </span>
              <span style={tagStyle(s.verdict)}>{MARK[s.verdict]}</span>
            </div>
          ))}
        </div>
      )}

      {note && (
        <div className="mt-3.5 pt-3 border-t border-white/[0.08] text-xs text-[#8b9298] leading-[1.5]">
          {note}
        </div>
      )}
    </div>
  );
}
