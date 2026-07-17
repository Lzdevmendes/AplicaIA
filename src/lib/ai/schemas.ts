import { z } from "zod";
import type { Json } from "@/lib/db/types";

/**
 * Schema do perfil extraído do CV.
 *
 * A ORDEM DOS CAMPOS IMPORTA. O modelo gera o JSON nesta sequência, e a rota
 * de parse acende os passos da tela de "Analisando seu CV…" conforme cada
 * chave aparece no stream. Reordenar aqui quebra o progresso da UI.
 */
export const ProfileSchema = z.object({
  full_name: z
    .string()
    .describe("Nome completo como aparece no CV. String vazia se não houver."),
  headline: z
    .string()
    .describe(
      'Cargo + senioridade, no formato "Desenvolvedor back-end · Pleno". ' +
        "Derivar da experiência mais recente se não estiver explícito.",
    ),
  seniority: z
    .string()
    .describe('Um de: "Júnior", "Pleno", "Sênior", "Especialista". Inferir dos anos de experiência.'),
  summary: z
    .string()
    .describe(
      "Resumo profissional de 2 a 3 frases em primeira pessoa implícita, no tom do CV. " +
        "Se o CV tiver um resumo, condensar; se não, escrever a partir das experiências.",
    ),

  experiences: z
    .array(
      z.object({
        role: z.string().describe("Cargo exercido."),
        company: z.string().describe("Empresa. String vazia se não constar."),
        period: z
          .string()
          .describe('Período como escrito no CV, ex: "2022 — atual", "2020 — 2022".'),
        note: z
          .string()
          .describe(
            "Uma frase sobre o que fez, priorizando resultado mensurável se o CV trouxer.",
          ),
      }),
    )
    .describe("Da mais recente para a mais antiga."),

  skills: z
    .array(z.string())
    .describe(
      "Competências técnicas: linguagens, frameworks, bancos, ferramentas. " +
        "Só o que está no CV — nunca inferir uma skill que não está escrita. " +
        'Normalizar a grafia canônica ("PostgreSQL", não "postgres").',
    ),

  education: z
    .array(
      z.object({
        course: z.string(),
        school: z.string(),
        period: z.string(),
      }),
    )
    .describe("Formação acadêmica."),

  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z
          .string()
          .describe('Emissor e ano, ex: "Amazon Web Services · 2024".'),
      }),
    )
    .describe("Certificações. Array vazio se não houver."),

  // Links ficam no FIM de propósito: o acender-passos do stream (rota cv/parse)
  // casa em "skills" e "education", que continuam nas mesmas posições.
  github: z
    .string()
    .describe(
      "Usuário ou URL do GitHub, se estiver no CV (ex: /marianaribeiro ou github.com/marianaribeiro). String vazia se não houver.",
    ),
  linkedin: z
    .string()
    .describe("Usuário ou URL do LinkedIn, se estiver no CV. String vazia se não houver."),
  website: z
    .string()
    .describe("Site pessoal/portfólio, se estiver no CV (ex: marianaribeiro.dev). String vazia se não houver."),
});

export type ExtractedProfile = z.infer<typeof ProfileSchema>;

/**
 * Remove os campos escalares vazios do perfil extraído antes de gravar.
 *
 * A RPC replace_profile preserva o que a chave não traz. Ao remover os escalares
 * que o CV não achou (string vazia), evitamos que reprocessar um CV sem github
 * apague o github que a pessoa digitou à mão. Os arrays (skills, experiences,
 * education, certifications) ficam sempre — o CV é autoritativo sobre eles.
 */
export function stripEmptyScalars(profile: ExtractedProfile): Json {
  const out: Record<string, Json> = {};
  for (const [key, value] of Object.entries(profile)) {
    if (typeof value === "string") {
      if (value.trim() !== "") out[key] = value;
    } else {
      out[key] = value as Json;
    }
  }
  return out;
}

/** Passos da tela de análise, na ordem em que os campos chegam no stream. */
export const ONBOARDING_STEPS = [
  { key: "read", label: "lendo o PDF" },
  { key: "experiences", label: "extraindo experiências" },
  { key: "skills", label: "identificando skills" },
  { key: "profile", label: "montando seu perfil" },
] as const;

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]["key"];

/** Eventos SSE emitidos por /api/cv/parse. */
export type ParseEvent =
  | { type: "step"; step: OnboardingStepKey }
  | { type: "done" }
  | { type: "error"; message: string };
