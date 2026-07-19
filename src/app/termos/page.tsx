import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Termos de Serviço · AplicaAI",
  description: "As regras de uso da AplicaAI.",
};

// Página pública (fora do grupo (app), liberada em proxy.ts). Necessária para o
// consent screen do Google e para deixar claro o que o serviço faz e não faz.

const ATUALIZADO_EM = "19 de julho de 2026";
const CONTATO = "lzmendestechdev@gmail.com";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="font-display font-bold text-[19px] tracking-[-0.01em] text-ink m-0 mb-2.5">
        {titulo}
      </h2>
      <div className="text-[14.5px] text-text2 leading-[1.65] space-y-3">{children}</div>
    </section>
  );
}

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-14">
      <article className="w-full max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[10px] bg-ink flex items-center justify-center shrink-0">
            <LogoMark size={20} />
          </div>
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted">
            AplicaAI
          </div>
        </div>

        <h1 className="font-display font-extrabold text-[32px] tracking-[-0.01em] text-ink m-0">
          Termos de Serviço
        </h1>
        <p className="text-[13px] text-faint mt-2 mb-1">Atualizados em {ATUALIZADO_EM}</p>

        <Secao titulo="1. Aceitação">
          <p>
            Ao entrar na AplicaAI com sua conta Google, você concorda com estes Termos e
            com a nossa{" "}
            <Link
              href="/privacidade"
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              Política de Privacidade
            </Link>
            . Se não concordar, não use o serviço.
          </p>
        </Secao>

        <Secao titulo="2. O que a AplicaAI faz">
          <p>
            A AplicaAI ajuda você a se candidatar a vagas: lê seu currículo e monta um
            perfil, extrai dados de uma vaga que você fornece, sugere um e-mail de
            candidatura e permite enviá-lo pela sua conta do Gmail, com o currículo
            anexado. Também organiza suas candidaturas e tarefas.
          </p>
        </Secao>

        <Secao titulo="3. Conteúdo gerado por inteligência artificial">
          <p>
            Os perfis, análises de compatibilidade e e-mails são gerados por inteligência
            artificial e servem como <strong className="text-ink font-semibold">rascunho</strong>.
            Podem conter erros ou imprecisões. <strong className="text-ink font-semibold">
            Você é responsável por revisar todo o conteúdo antes de enviá-lo</strong> e o
            envio parte de uma ação sua. A AplicaAI não garante resultado em processos
            seletivos, entrevistas ou contratações.
          </p>
        </Secao>

        <Secao titulo="4. Suas responsabilidades">
          <p>
            Você concorda em usar o serviço de forma lícita, fornecer informações
            verdadeiras e não usá-lo para enviar spam, mensagens enganosas ou qualquer
            conteúdo ilegal. O uso da sua conta do Gmail para envio segue também os termos
            do Google.
          </p>
        </Secao>

        <Secao titulo="5. Conta e exclusão de dados">
          <p>
            Você pode apagar sua conta e todos os dados associados a qualquer momento, pela
            opção de exclusão dentro do app ou escrevendo para{" "}
            <a
              href={`mailto:${CONTATO}`}
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              {CONTATO}
            </a>
            . Detalhes sobre o tratamento dos dados estão na Política de Privacidade.
          </p>
        </Secao>

        <Secao titulo="6. Serviço &quot;como está&quot; e limitação de responsabilidade">
          <p>
            A AplicaAI é oferecida &quot;como está&quot;, sem garantias de disponibilidade
            ininterrupta ou de adequação a um fim específico. Na máxima extensão permitida
            pela lei, a AplicaAI não se responsabiliza por danos indiretos ou por
            consequências decorrentes do uso do serviço ou do conteúdo gerado.
          </p>
        </Secao>

        <Secao titulo="7. Mudanças nos termos">
          <p>
            Estes Termos podem ser atualizados. Mudanças relevantes serão sinalizadas no
            app. O uso continuado após uma atualização significa concordância com a nova
            versão.
          </p>
        </Secao>

        <Secao titulo="8. Contato">
          <p>
            Dúvidas sobre estes Termos? Fale com a gente em{" "}
            <a
              href={`mailto:${CONTATO}`}
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              {CONTATO}
            </a>
            .
          </p>
        </Secao>

        <div className="mt-12 pt-6 border-t border-border">
          <Link
            href="/login"
            className="text-[13px] text-muted hover:text-ink transition-colors"
          >
            ← Voltar para o login
          </Link>
        </div>
      </article>
    </main>
  );
}
