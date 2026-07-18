# AplicaAI

SaaS de candidaturas: o usuário sobe o CV, a IA monta o perfil; ele cola uma
vaga (texto ou print), a IA extrai os dados, calcula o match de skills, escreve
o e-mail de candidatura e envia pelo Gmail dele com o CV anexado. Tudo é
rastreado num kanban de candidaturas e num módulo de tarefas com sprints.

## Telas

- **Onboarding** — sobe o CV (PDF), a IA extrai o perfil.
- **Nova candidatura** — cola a vaga → metadados + match de skills + e-mail pronto.
- **Tracker** — kanban de candidaturas com métricas (taxa de resposta, tempo de retorno).
- **Tarefas** — kanban com sprints, subtarefas, etiquetas, atividade.
- **Perfil** — o perfil montado pelo onboarding.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4 ·
Supabase (Postgres, `sa-east-1`) · Google Gemini (`@google/genai`,
`gemini-2.5-flash`, tier gratuito) · @dnd-kit · Vercel.

## Rodar

```bash
npm install
cp .env.example .env.local   # e preencher (ver DEPLOY.md)
npm run dev                  # localhost:3000
```

Sem `GEMINI_API_KEY` o app roda, mas os fluxos de IA (parse do CV, extração
de vaga, geração do e-mail) retornam erro. Sem as credenciais do Google OAuth,
o envio usa o deep link do Gmail em vez da API.

## Scripts

```bash
npm run build      # produção
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # vitest run — testes unitários dos helpers puros
npm run test:e2e   # playwright — telas, drawer, arraste (precisa do seed de dev)
npm run db:types   # regenera src/lib/db/types.ts a partir do schema
```

## Documentação

- **DEPLOY.md** — o que configurar por fora (Anthropic, Google, Vercel) e o
  passo-a-passo para o ar.
- **AGENTS.md** — regras do projeto (fronteiras de segurança, RLS, convenções).

## Origem do design

A UI segue o protótipo `AplicaAI.dc.html` (handoff do Claude Design). Os tokens
estão em `src/lib/design/tokens.ts` e no `@theme` de `src/app/globals.css`.
