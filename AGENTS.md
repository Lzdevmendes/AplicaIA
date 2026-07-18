<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AplicaAI

SaaS pt-BR de candidaturas: o usuário sobe o CV, a IA monta o perfil; ele cola
uma vaga (texto ou print), a IA extrai os dados, calcula o match de skills,
escreve o e-mail e envia pelo Gmail dele com o CV anexado. Tudo rastreado num
kanban de candidaturas e num módulo de tarefas com sprints.

## Origem do design

`AplicaAI.dc.html` (handoff do Claude Design, em `~/Downloads/VagaPilot — UI de
candidaturas-handoff.zip`) é a **especificação visual**. É um protótipo numa DSL
própria (`<sc-if>`, `<sc-for>`, `DCLogic`) com dados fixos — não copiar a
estrutura dele, só reproduzir a saída visual. Os valores estão destilados em
`src/lib/design/tokens.ts` e no `@theme` de `src/app/globals.css`; mudança de
cor, medida ou animação se confere contra o protótipo e os screenshots do
handoff, não por gosto.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind 4
· Supabase (Postgres 17, `sa-east-1`) · `@google/genai` · @dnd-kit · Vercel.

## Regras que não se quebram

- **Toda chamada ao Gemini e ao Gmail é server-side.** `GEMINI_API_KEY` e o
  refresh token do Google nunca chegam ao browser.
- **RLS é a fronteira de segurança**, não a UI. Toda tabela por usuário tem
  policy `auth.uid() = user_id`. Mudou schema, roda `get_advisors` e testa com
  dois usuários.
- **`createAdminClient()` ignora RLS.** Só para `google_accounts`. Toda query
  ali filtra `user_id` na mão. Nunca importar de client component.
- **`getUser()`, nunca `getSession()`** para decidir acesso — `getSession()` só
  lê o cookie, que o cliente forja.
- **Não parsear PDF nem rodar OCR**: o Gemini lê PDF e imagem nativamente. A
  **única exceção** é `src/lib/cv/pdf-links.ts`, que varre só a camada de
  anotação de hyperlink (o `/URI` por trás de ícones "GitHub"/"LinkedIn") — a
  única coisa que o Gemini comprovadamente não enxerga. Completa os links
  vazios, não substitui a leitura. Não estender isso para conteúdo/OCR.
- **Métricas são calculadas** pela view `application_metrics`, nunca fixas.

## Banco

Projeto Supabase `aplicaai` (`plxzmbvoelasnwotozxi`), região `sa-east-1`.
Migrations em `supabase/migrations/`. Tipos gerados: `npm run db:types`.

`google_accounts` e `task_counters` têm RLS ligada e **zero policies** de
propósito: só o service_role acessa. O advisor aponta isso como INFO — é
esperado, não regredir "consertando".

Chaves `AP-NN` são atribuídas pelo trigger `assign_task_key` (SECURITY DEFINER,
porque `task_counters` é fechada para `authenticated`).

## Comandos

```bash
npm run dev        # localhost:3000
npm run build      # tem que passar sem warning
npm run typecheck
npm run lint
npm run db:types   # regenera src/lib/db/types.ts a partir do schema
```

## Verificação

Não basta compilar. Cada fase se prova rodando o fluxo: subir um CV real e
conferir o perfil, colar uma vaga real e conferir o e-mail extraído, enviar um
e-mail de teste e abrir a caixa. Comparar cada tela com os screenshots do
handoff antes de dar por pronta.
