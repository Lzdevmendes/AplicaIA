import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db/types";

/** Cliente do browser. Só enxerga o que a RLS do usuário logado permite. */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
