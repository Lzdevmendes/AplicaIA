import { describe, it, expect } from "vitest";
import { ProfileSchema, stripEmptyScalars } from "./schemas";
import { JobExtractionSchema, EmailSchema } from "./job-schemas";

describe("ProfileSchema", () => {
  const valid = {
    full_name: "Mariana",
    headline: "Back-end · Pleno",
    seniority: "Pleno",
    summary: "resumo",
    experiences: [{ role: "Dev", company: "Acme", period: "2020", note: "n" }],
    skills: ["Python", "Django"],
    education: [{ course: "CC", school: "USP", period: "2015" }],
    certifications: [{ name: "AWS", issuer: "Amazon" }],
    github: "/mari",
    linkedin: "/in/mari",
    website: "mari.dev",
  };

  it("aceita um perfil completo", () => {
    expect(ProfileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita quando falta um campo obrigatório", () => {
    const { skills, ...semSkills } = valid;
    void skills;
    expect(ProfileSchema.safeParse(semSkills).success).toBe(false);
  });

  it("rejeita skills que não são strings", () => {
    expect(ProfileSchema.safeParse({ ...valid, skills: [{ nao: "string" }] }).success).toBe(
      false,
    );
  });
});

describe("stripEmptyScalars", () => {
  const base = ProfileSchema.parse({
    full_name: "Mariana",
    headline: "Back-end · Pleno",
    seniority: "Pleno",
    summary: "resumo",
    experiences: [],
    skills: ["Python"],
    education: [],
    certifications: [],
    github: "",
    linkedin: "",
    website: "",
  });

  it("remove os escalares vazios (para o parse não apagar o manual)", () => {
    const out = stripEmptyScalars(base) as Record<string, unknown>;
    expect(out).not.toHaveProperty("github");
    expect(out).not.toHaveProperty("linkedin");
    expect(out).not.toHaveProperty("website");
  });

  it("mantém os escalares preenchidos", () => {
    const out = stripEmptyScalars({ ...base, github: "/mari" }) as Record<string, unknown>;
    expect(out.github).toBe("/mari");
    expect(out.full_name).toBe("Mariana");
  });

  it("mantém os arrays mesmo vazios (o CV é autoritativo sobre eles)", () => {
    const out = stripEmptyScalars(base) as Record<string, unknown>;
    expect(out).toHaveProperty("experiences");
    expect(out).toHaveProperty("skills");
    expect(out.skills).toEqual(["Python"]);
  });
});

describe("JobExtractionSchema", () => {
  const valid = {
    company: "R030",
    role: "Back-end",
    work_model: "PJ · Remoto",
    source: "LinkedIn",
    contact_email: "rh@r030.tech",
    skills: [
      { name: "Python", verdict: "match" },
      { name: "Kafka", verdict: "partial" },
      { name: "React", verdict: "miss" },
    ],
    note: "enfatize Python",
  };

  it("aceita extração válida com os três vereditos", () => {
    expect(JobExtractionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita veredito fora do enum", () => {
    const bad = { ...valid, skills: [{ name: "X", verdict: "talvez" }] };
    expect(JobExtractionSchema.safeParse(bad).success).toBe(false);
  });

  it("aceita contact_email vazio (a regra de não inventar)", () => {
    expect(JobExtractionSchema.safeParse({ ...valid, contact_email: "" }).success).toBe(true);
  });
});

describe("EmailSchema", () => {
  it("exige assunto e corpo", () => {
    expect(EmailSchema.safeParse({ subject: "s", body: "b" }).success).toBe(true);
    expect(EmailSchema.safeParse({ subject: "s" }).success).toBe(false);
  });
});
