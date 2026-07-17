import { z } from "zod";

/**
 * Extração da vaga + match de skills numa chamada só.
 *
 * O match precisa das skills do perfil como contexto, então não faz sentido
 * separar em duas chamadas. O veredito de cada skill ("bate", "parcial",
 * "faltando") é decisão do modelo — o "parcial" ("GraphQL você cita como em
 * evolução") exige julgamento que um Set.has() não dá.
 */
export const JobExtractionSchema = z.object({
  company: z.string().describe("Nome da empresa. String vazia se não der para identificar."),
  role: z.string().describe("Cargo da vaga."),
  work_model: z
    .string()
    .describe('Modelo e contrato, ex: "PJ · Remoto", "CLT · Híbrido". Vazio se não constar.'),
  source: z
    .string()
    .describe('De onde veio, ex: "LinkedIn", "Gupy". Vazio se não der para saber.'),
  contact_email: z
    .string()
    .describe(
      "E-mail de contato para onde enviar a candidatura. String vazia se a vaga não trouxer um e-mail. " +
        "NUNCA invente um e-mail — se não estiver escrito, deixe vazio.",
    ),

  skills: z
    .array(
      z.object({
        name: z.string().describe("Nome da skill requerida pela vaga."),
        verdict: z
          .enum(["match", "partial", "miss"])
          .describe(
            'Comparando com o perfil do candidato: "match" se ele tem a skill; ' +
              '"partial" se tem algo próximo ou adjacente (ex: vaga pede GraphQL, ele tem REST); ' +
              '"miss" se não tem nada relacionado.',
          ),
      }),
    )
    .describe(
      "Principais skills técnicas exigidas pela vaga, na ordem de importância para a vaga. " +
        "Compare cada uma com o perfil. Máximo 8.",
    ),

  note: z
    .string()
    .describe(
      "Uma ou duas frases de estratégia para o e-mail: o que enfatizar (skills que batem), " +
        "o que citar com cuidado (parciais), em português. " +
        'Ex: "Enfatize Python e FastAPI. GraphQL você pode citar como em evolução."',
    ),
});

export type JobExtraction = z.infer<typeof JobExtractionSchema>;

/** E-mail gerado. */
export const EmailSchema = z.object({
  subject: z.string().describe("Assunto do e-mail de candidatura."),
  body: z.string().describe("Corpo do e-mail, pronto para enviar."),
});

export type GeneratedEmail = z.infer<typeof EmailSchema>;
