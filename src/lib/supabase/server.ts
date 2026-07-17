import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/db/types";

/**
 * Cliente para Server Components, Route Handlers e Server Actions.
 * Continua sujeito à RLS — é a sessão do usuário, não um bypass.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component não pode escrever cookie. O middleware já renova
            // a sessão, então aqui é seguro ignorar.
          }
        },
      },
    },
  );
}

/**
 * Cliente com service role: ignora RLS por completo.
 *
 * Usar só onde o servidor precisa de algo que o usuário não pode ler
 * diretamente — hoje, o refresh token em `google_accounts`. Toda query aqui
 * precisa filtrar por user_id na mão, porque não há RLS te protegendo.
 * Nunca importar isto de um componente de client.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
