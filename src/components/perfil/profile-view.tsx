import { Card, CardLabel } from "@/components/ui/card";
import { IconCheckCircle } from "@/components/ui/icons";
import type { EditableProfile } from "@/lib/ai/edit-schema";

/** Modo leitura do perfil — os cards do protótipo. */
export function ProfileView({ profile }: { profile: EditableProfile }) {
  const { skills, experiences, education, certifications } = profile;

  return (
    <div className="flex flex-col gap-3.5">
      {profile.summary && (
        <Card>
          <CardLabel>Resumo</CardLabel>
          <p className="m-0 text-sm leading-[1.65] text-text2">{profile.summary}</p>
        </Card>
      )}

      {skills.length > 0 && (
        <Card>
          <CardLabel>Skills</CardLabel>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="font-mono text-[12.5px] text-ink bg-bg border border-border rounded-md px-[11px] py-1.5"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {experiences.length > 0 && (
        <Card>
          <CardLabel>Experiências</CardLabel>
          <div className="flex flex-col">
            {experiences.map((ex, i) => (
              <div key={i} className="flex gap-4 pb-[18px]">
                <div className="flex-none flex flex-col items-center pt-[3px]">
                  <span className="w-[9px] h-[9px] rounded-full bg-pine shadow-[0_0_0_3px_var(--color-pine-tint)]" />
                  {i < experiences.length - 1 && (
                    <span className="w-[1.5px] flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display font-bold text-[15px]">{ex.role}</div>
                    {ex.period && (
                      <div className="font-mono text-[11px] text-muted whitespace-nowrap">
                        {ex.period}
                      </div>
                    )}
                  </div>
                  {ex.company && (
                    <div className="text-[13px] text-pine mt-0.5 mb-1.5">{ex.company}</div>
                  )}
                  {ex.note && (
                    <div className="text-[13px] text-muted leading-[1.55]">{ex.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(education.length > 0 || certifications.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Card>
            <CardLabel>Formação</CardLabel>
            <div className="flex flex-col gap-3.5">
              {education.length === 0 && (
                <span className="text-[13px] text-faint">Nada ainda.</span>
              )}
              {education.map((ed, i) => (
                <div key={i}>
                  <div className="font-display font-bold text-sm leading-[1.25]">
                    {ed.course}
                  </div>
                  {ed.school && (
                    <div className="text-[12.5px] text-muted mt-0.5">{ed.school}</div>
                  )}
                  {ed.period && (
                    <div className="font-mono text-[10.5px] text-faint mt-[3px]">
                      {ed.period}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardLabel>Certificações</CardLabel>
            <div className="flex flex-col gap-[11px]">
              {certifications.length === 0 && (
                <span className="text-[13px] text-faint">Nada ainda.</span>
              )}
              {certifications.map((ct, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <IconCheckCircle size={16} className="flex-none mt-px" />
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium leading-[1.3]">{ct.name}</div>
                    {ct.issuer && (
                      <div className="font-mono text-[10.5px] text-faint mt-0.5">
                        {ct.issuer}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Card>
          <CardLabel>Preferências</CardLabel>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <Pref label="Contrato" value={profile.contract} />
            <Pref label="Modelo" value={profile.work_model} />
            <Pref label="Pretensão" value={profile.salary_range} mono />
            <Pref label="Senioridade" value={profile.seniority} />
          </div>
        </Card>

        <Card>
          <CardLabel>Links</CardLabel>
          <div className="flex flex-col gap-2.5 text-[13.5px]">
            <Pref label="GitHub" value={profile.github} mono />
            <Pref label="LinkedIn" value={profile.linkedin} mono />
            <Pref label="Site" value={profile.website} mono />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Pref({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      {value ? (
        <span className={mono ? "font-mono text-xs" : "font-medium"}>{value}</span>
      ) : (
        <span className="text-faint">—</span>
      )}
    </div>
  );
}
