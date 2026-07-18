import { test as setup, expect } from "@playwright/test";
import { BASE_URL } from "../playwright.config";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const REF = SUPABASE_URL.match(/https:\/\/([^.]+)\./)![1];

const DEV_EMAIL = "dev@aplicaai.test";
const DEV_PASSWORD = "devsenha123";

/**
 * Autentica o usuário de dev via password grant e grava o storageState, no
 * mesmo formato de cookie chunked que o @supabase/ssr lê. Os testes reusam
 * esse estado — não passam pela tela de login do Google.
 */
setup("autentica o usuário de dev", async ({ context, page }) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
  });
  const session = await res.json();
  if (!res.ok) throw new Error(`login de dev falhou: ${JSON.stringify(session)}`);

  session.expires_at = Math.floor(Date.now() / 1000) + session.expires_in;
  const value =
    "base64-" + Buffer.from(JSON.stringify(session), "utf-8").toString("base64");

  const name = `sb-${REF}-auth-token`;
  const CHUNK = 3180;
  const url = new URL(BASE_URL);
  const cookies =
    value.length <= CHUNK
      ? [{ name, value }]
      : Array.from({ length: Math.ceil(value.length / CHUNK) }, (_, i) => ({
          name: `${name}.${i}`,
          value: value.slice(i * CHUNK, (i + 1) * CHUNK),
        }));

  await context.addCookies(
    cookies.map((c) => ({
      ...c,
      domain: url.hostname,
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax" as const,
    })),
  );

  // Confirma que a sessão vale: /nova não redireciona para /login.
  await page.goto("/nova");
  await expect(page).toHaveURL(/\/nova$/);

  await context.storageState({ path: "e2e/.auth/state.json" });
});
