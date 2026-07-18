"use client";

import { useState } from "react";
import { Card, CardLabel } from "@/components/ui/card";
import { IconPlus, IconClose } from "@/components/ui/icons";
import { SENIORITY_OPTIONS, type EditableProfile } from "@/lib/ai/edit-schema";

const inputCls =
  "w-full border border-border rounded-lg px-3 py-2 text-[13.5px] text-ink bg-bg outline-none focus:border-pine focus:bg-surface";

/** Modo edição — formulário de todos os campos do perfil. */
export function ProfileForm({
  draft,
  onChange,
}: {
  draft: EditableProfile;
  onChange: (next: EditableProfile) => void;
}) {
  const set = <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) =>
    onChange({ ...draft, [key]: value });

  return (
    <div className="flex flex-col gap-3.5">
      <Card>
        <CardLabel>Básico</CardLabel>
        <div className="flex flex-col gap-3">
          <Field label="Nome">
            <input className={inputCls} value={draft.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Headline">
              <input className={inputCls} value={draft.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Desenvolvedor back-end · Pleno" />
            </Field>
            <Field label="Senioridade">
              <select className={inputCls} value={draft.seniority} onChange={(e) => set("seniority", e.target.value)}>
                <option value="">—</option>
                {SENIORITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Resumo">
            <textarea
              className={`${inputCls} h-24 leading-[1.6]`}
              value={draft.summary}
              onChange={(e) => set("summary", e.target.value)}
              placeholder="2 a 3 frases sobre você."
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardLabel>Skills</CardLabel>
        <SkillsEditor value={draft.skills} onChange={(skills) => set("skills", skills)} />
      </Card>

      <Card>
        <CardLabel>Experiências</CardLabel>
        <RowsEditor
          rows={draft.experiences}
          onChange={(experiences) => set("experiences", experiences)}
          empty={{ role: "", company: "", period: "", note: "" }}
          addLabel="Adicionar experiência"
          render={(row, update) => (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <input className={inputCls} placeholder="Cargo" value={row.role} onChange={(e) => update({ ...row, role: e.target.value })} />
                <input className={inputCls} placeholder="Empresa" value={row.company} onChange={(e) => update({ ...row, company: e.target.value })} />
              </div>
              <input className={inputCls} placeholder="Período (ex: 2022 — atual)" value={row.period} onChange={(e) => update({ ...row, period: e.target.value })} />
              <textarea className={`${inputCls} h-16`} placeholder="O que fez, com resultado se houver." value={row.note} onChange={(e) => update({ ...row, note: e.target.value })} />
            </>
          )}
        />
      </Card>

      <div className="grid grid-cols-2 gap-3.5">
        <Card>
          <CardLabel>Formação</CardLabel>
          <RowsEditor
            rows={draft.education}
            onChange={(education) => set("education", education)}
            empty={{ course: "", school: "", period: "" }}
            addLabel="Adicionar formação"
            render={(row, update) => (
              <>
                <input className={inputCls} placeholder="Curso" value={row.course} onChange={(e) => update({ ...row, course: e.target.value })} />
                <input className={inputCls} placeholder="Instituição" value={row.school} onChange={(e) => update({ ...row, school: e.target.value })} />
                <input className={inputCls} placeholder="Período" value={row.period} onChange={(e) => update({ ...row, period: e.target.value })} />
              </>
            )}
          />
        </Card>

        <Card>
          <CardLabel>Certificações</CardLabel>
          <RowsEditor
            rows={draft.certifications}
            onChange={(certifications) => set("certifications", certifications)}
            empty={{ name: "", issuer: "" }}
            addLabel="Adicionar certificação"
            render={(row, update) => (
              <>
                <input className={inputCls} placeholder="Nome" value={row.name} onChange={(e) => update({ ...row, name: e.target.value })} />
                <input className={inputCls} placeholder="Emissor · ano" value={row.issuer} onChange={(e) => update({ ...row, issuer: e.target.value })} />
              </>
            )}
          />
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3.5">
        <Card>
          <CardLabel>Preferências</CardLabel>
          <div className="flex flex-col gap-3">
            <Field label="Contrato">
              <input className={inputCls} value={draft.contract} onChange={(e) => set("contract", e.target.value)} placeholder="PJ ou CLT" />
            </Field>
            <Field label="Modelo">
              <input className={inputCls} value={draft.work_model} onChange={(e) => set("work_model", e.target.value)} placeholder="Remoto" />
            </Field>
            <Field label="Pretensão">
              <input className={inputCls} value={draft.salary_range} onChange={(e) => set("salary_range", e.target.value)} placeholder="R$ 12–15k" />
            </Field>
          </div>
        </Card>

        <Card>
          <CardLabel>Links</CardLabel>
          <div className="flex flex-col gap-3">
            <Field label="GitHub">
              <input className={inputCls} value={draft.github} onChange={(e) => set("github", e.target.value)} placeholder="/usuario" />
            </Field>
            <Field label="LinkedIn">
              <input className={inputCls} value={draft.linkedin} onChange={(e) => set("linkedin", e.target.value)} placeholder="/in/usuario" />
            </Field>
            <Field label="Site">
              <input className={inputCls} value={draft.website} onChange={(e) => set("website", e.target.value)} placeholder="seusite.dev" />
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10.5px] tracking-[0.08em] uppercase text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

function SkillsEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (skills: string[]) => void;
}) {
  const [input, setInput] = useState("");

  function add() {
    const s = input.trim();
    if (s && !value.includes(s)) onChange([...value, s]);
    setInput("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((skill) => (
          <span
            key={skill}
            className="font-mono text-[12.5px] text-ink bg-bg border border-border rounded-md pl-[11px] pr-1.5 py-1.5 flex items-center gap-1.5"
          >
            {skill}
            <button
              type="button"
              onClick={() => onChange(value.filter((s) => s !== skill))}
              aria-label={`Remover ${skill}`}
              className="text-faint hover:text-clay flex items-center"
            >
              <IconClose size={12} />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-[13px] text-faint">Nenhuma skill ainda.</span>}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Digite uma skill e Enter"
        />
        <button
          type="button"
          onClick={add}
          className="flex-none border border-border bg-surface rounded-lg px-3 text-[13px] font-medium hover:border-pine hover:text-pine transition-colors"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

function RowsEditor<T>({
  rows,
  onChange,
  empty,
  addLabel,
  render,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  empty: T;
  addLabel: string;
  render: (row: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="relative flex flex-col gap-2.5 border border-border rounded-lg p-3 bg-bg">
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            aria-label="Remover"
            className="absolute top-2 right-2 w-6 h-6 rounded-md text-faint hover:text-clay hover:bg-subtle flex items-center justify-center"
          >
            <IconClose size={13} />
          </button>
          {render(row, (next) => onChange(rows.map((r, j) => (j === i ? next : r))))}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, empty])}
        className="flex items-center justify-center gap-1.5 border-[1.5px] border-dashed border-border2 rounded-lg py-2.5 text-[12.5px] text-faint hover:border-pine hover:text-pine transition-colors"
      >
        <IconPlus size={13} />
        {addLabel}
      </button>
    </div>
  );
}
