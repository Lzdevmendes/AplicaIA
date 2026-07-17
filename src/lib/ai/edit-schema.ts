import { z } from "zod";

/**
 * Schema da edição manual do perfil. Superset da ProfileSchema com os campos
 * que o CV nunca traz (preferências). Tudo opcional/string livre — a edição é
 * autoritativa: envia todos os campos, e a RPC replace_profile grava tudo
 * (inclusive limpar um campo esvaziado).
 */
export const EditableProfileSchema = z.object({
  full_name: z.string(),
  headline: z.string(),
  seniority: z.string(),
  summary: z.string(),

  // Preferências — nunca vêm do CV.
  contract: z.string(),
  work_model: z.string(),
  salary_range: z.string(),

  // Links.
  github: z.string(),
  linkedin: z.string(),
  website: z.string(),

  skills: z.array(z.string()),
  experiences: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      period: z.string(),
      note: z.string(),
    }),
  ),
  education: z.array(
    z.object({
      course: z.string(),
      school: z.string(),
      period: z.string(),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
    }),
  ),
});

export type EditableProfile = z.infer<typeof EditableProfileSchema>;

/** Senioridades sugeridas no select. */
export const SENIORITY_OPTIONS = ["Júnior", "Pleno", "Sênior", "Especialista"] as const;
