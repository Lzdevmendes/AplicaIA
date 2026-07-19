"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/ui/icons";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // gmail.send pedido já no consentimento inicial — evita uma segunda
        // tela do Google depois. É "sensitive", exige verificação do app antes
        // de abrir ao público (2–8 semanas); até lá o envio usa o deep link.
        scopes: "email profile https://www.googleapis.com/auth/gmail.send",
        // access_type + prompt=consent são o que faz o Google devolver um
        // refresh token; sem eles só vem o access token de 1h e o envio pelo
        // Gmail quebra quando o usuário volta no dia seguinte.
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 sm:p-10 bg-bg">
      <div className="w-full max-w-[440px] text-center">
        <div className="w-12 h-12 rounded-[11px] bg-ink flex items-center justify-center mx-auto mb-6">
          <LogoMark size={24} />
        </div>

        <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted mb-3.5">
          AplicaAI
        </div>
        <h1 className="font-display font-extrabold text-[30px] tracking-[-0.01em] m-0 mb-2.5">
          Transforme a vaga em um e-mail pronto
        </h1>
        <p className="text-[14px] text-muted leading-[1.55] m-0 mb-7">
          Entre com sua conta Google para começar.
        </p>

        <button
          onClick={signIn}
          disabled={loading}
          className="w-full bg-pine text-white rounded-lg py-3.5 text-sm font-semibold cursor-pointer hover:bg-pine-dark transition-colors disabled:opacity-60 disabled:cursor-default"
        >
          {loading ? "Redirecionando…" : "Entrar com Google"}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-clay">
            {error}
          </p>
        )}

        <p className="text-xs text-faint leading-[1.5] mt-[18px]">
          Seus dados são privados. Você pode apagar tudo quando quiser.
        </p>
        <p className="text-xs text-faint leading-[1.5] mt-2">
          <Link
            href="/privacidade"
            className="underline underline-offset-2 hover:text-muted transition-colors"
          >
            Política de Privacidade
          </Link>
        </p>
      </div>
    </main>
  );
}
