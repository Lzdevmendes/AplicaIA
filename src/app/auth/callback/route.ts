import { NextResponse, type NextRequest } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/crypto";

/** Troca o `code` do OAuth pela sessão e manda o usuário para dentro do app. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/nova";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?erro=sem_codigo`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?erro=${encodeURIComponent(error.message)}`,
    );
  }

  // O Google só devolve o refresh token no primeiro consentimento (com
  // prompt=consent). Guardamos aqui — é o que permite mintar access tokens
  // depois, sem reautenticar, para enviar pelo Gmail.
  const session = data.session;
  const refreshToken = session?.provider_refresh_token;
  if (session?.user && refreshToken) {
    try {
      const admin = createAdminClient();
      await admin.from("google_accounts").upsert({
        user_id: session.user.id,
        email: session.user.email ?? "",
        refresh_token: encryptToken(refreshToken),
        scopes: ["https://www.googleapis.com/auth/gmail.send"],
      });
    } catch (err) {
      // Não bloqueia o login: o usuário entra e cai no fallback de deep link
      // até reconectar o Google.
      console.error("[auth/callback] falha ao gravar google refresh token", err);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
