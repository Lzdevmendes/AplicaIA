# Deploy — AplicaAI

Guia do que precisa ser configurado por fora para colocar no ar. O código está
pronto; o que falta são credenciais e serviços que só você tem acesso.

## Estado atual

| Fase | Construído | Verificado |
|---|---|---|
| Fundação (Next 16, Supabase, design, auth) | ✅ | ✅ rodando |
| Onboarding + Perfil | ✅ | ✅ exceto a chamada ao Gemini (sem chave) |
| Nova candidatura | ✅ | ✅ exceto as chamadas ao Gemini |
| Tracker | ✅ | ✅ inclusive métricas e persistência |
| Tarefas | ✅ | ✅ inclusive drawer, subtarefas, cor |
| Gmail | ✅ | ✅ MIME e deep link; envio real depende do Google |

**Banco:** projeto Supabase `aplicaai` (`plxzmbvoelasnwotozxi`), região `sa-east-1`.
Schema, RLS e otimizações já aplicados. RLS testada com forja entre usuários.

## 1. Secrets no `.env.local` (dev) e na Vercel (prod)

```
NEXT_PUBLIC_SUPABASE_URL=https://plxzmbvoelasnwotozxi.supabase.co   # já preenchido
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...                    # já preenchido
SUPABASE_SERVICE_ROLE_KEY=                # Supabase > Settings > API Keys > service_role
GEMINI_API_KEY=                           # aistudio.google.com > Get API key (grátis)
GOOGLE_CLIENT_ID=                         # ver passo 3
GOOGLE_CLIENT_SECRET=                     # ver passo 3
GOOGLE_REDIRECT_URI=https://SEU_DOMINIO/auth/callback
TOKEN_ENCRYPTION_KEY=                     # openssl rand -base64 32 (cifra o refresh token)
NEXT_PUBLIC_GMAIL_SEND_MODE=deeplink      # trocar para "api" só após o passo 4
```

> ⚠️ Gere um `TOKEN_ENCRYPTION_KEY` **novo e diferente** para produção
> (`openssl rand -base64 32`). Se ele mudar depois que houver tokens gravados,
> os refresh tokens já cifrados ficam ilegíveis e os usuários precisam
> reconectar o Google. Guarde-o como qualquer segredo.

Na Vercel, cadastrar tudo em Project Settings > Environment Variables. O
`SUPABASE_SERVICE_ROLE_KEY` e o `GEMINI_API_KEY` **nunca** com prefixo
`NEXT_PUBLIC_` — eles não podem vazar para o browser.

## 2. Google Gemini (os fluxos de IA)

Só colar a `GEMINI_API_KEY` (pegue grátis em aistudio.google.com > Get API key).
Depois disso, para fechar a verificação (tarefa interna B1/B2/B3): subir o CV de
teste em `onboarding`, conferir o perfil extraído, e colar uma vaga real em
`nova` conferindo o match e o e-mail.

Modelo em uso: `gemini-2.5-flash` — tier gratuito, lê PDF e imagem nativamente.
O tier free tem limite de requisições por minuto/dia (suficiente pra você e os
primeiros usuários). Se escalar, dá para subir para um tier pago ou trocar de
modelo — a IA está isolada em `src/lib/ai/gemini.ts` e nas 3 rotas.

## 3. Google OAuth (login + Gmail)

O login já é Google, e o mesmo consentimento pede o escopo `gmail.send`.

1. **Google Cloud Console** > APIs & Services > Credentials > Create OAuth 2.0
   Client ID (Web application).
   - Authorized redirect URIs:
     - `https://plxzmbvoelasnwotozxi.supabase.co/auth/v1/callback` (Supabase)
     - `http://localhost:3000/auth/callback` (dev)
     - `https://SEU_DOMINIO/auth/callback` (prod)
2. Habilitar a **Gmail API** no projeto do Google Cloud.
3. Tela de consentimento OAuth: adicionar o escopo
   `https://www.googleapis.com/auth/gmail.send`.
4. **Supabase** > Authentication > Providers > Google: colar o Client ID e o
   Secret.
5. `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

## 4. Verificação OAuth do Google (o gargalo de prazo)

O escopo `gmail.send` é **sensitive**. Sem a verificação do app, o Google limita
a 100 usuários em "modo de teste" e mostra a tela de "app não verificado".

- **Abra a verificação assim que possível** — leva de 2 a 8 semanas e não
  bloqueia nada: enquanto isso, o app funciona com `NEXT_PUBLIC_GMAIL_SEND_MODE=deeplink`
  (abre um rascunho pronto no Gmail, o usuário anexa o CV e envia).
- `gmail.send` é sensitive, **não** restricted — não exige a auditoria de
  segurança CASA.
- Quando a verificação sair, trocar `NEXT_PUBLIC_GMAIL_SEND_MODE` para `api`.
  A partir daí o envio é automático, com o CV anexado.

## 5. Antes de abrir ao público

- [ ] Apagar o usuário de dev do banco: `dev@aplicaai.test`
      (id `33333333-3333-3333-3333-333333333333`) e seus dados de seed.
- [ ] Supabase > Auth > URL Configuration: setar o Site URL e os Redirect URLs
      para o domínio de produção.
- [ ] Supabase > Auth > Providers: habilitar **Leaked Password Protection**
      (advisor sinalizou; baixa relevância porque o login é só Google, mas é um
      toggle grátis).
- [ ] `refresh_token` do Google é cifrado em repouso (AES-256-GCM, chave em
      `TOKEN_ENCRYPTION_KEY`) além de estar em tabela service-role-only. Gere a
      chave de produção com `openssl rand -base64 32` e não a perca.
- [ ] Observabilidade: plugar Sentry (ou similar) nas rotas `/api/*`.

## 6. Deploy na Vercel

```bash
# Conectar o repo na Vercel (ou vercel --prod pela CLI).
# As migrations do banco já foram aplicadas no projeto Supabase.
# Para reaplicar num projeto novo:
supabase link --project-ref SEU_REF
supabase db push
```

Regenerar os tipos após qualquer mudança de schema: `npm run db:types`.

## Verificação local

```bash
npm run dev        # localhost:3000
npm run build      # tem que passar sem warning
npm run typecheck
npm run lint
npm test           # vitest — helpers puros (MIME, deep link, retry, schemas, datas)

# Testes de RLS (isolamento entre usuários) — precisam de conexão ao Postgres:
psql "$DATABASE_URL" -f supabase/tests/rls_isolation.test.sql
# (ou, com o stack local: supabase start && psql da porta local)
```
