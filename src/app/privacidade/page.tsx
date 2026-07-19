import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Política de Privacidade · AplicaAI",
  description:
    "Como a AplicaAI coleta, usa e protege seus dados, incluindo o acesso às APIs do Google.",
};

// Página pública (fora do grupo (app), sem exigir login). É o link de
// privacidade que a verificação OAuth do Google exige — e traz a declaração
// de Uso Limitado dos dados recebidos das APIs do Google.

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

export default function PrivacidadePage() {
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
          Política de Privacidade
        </h1>
        <p className="text-[13px] text-faint mt-2 mb-1">Atualizada em {ATUALIZADO_EM}</p>

        <Secao titulo="Quem somos">
          <p>
            A AplicaAI é uma ferramenta que ajuda você a se candidatar a vagas: você
            envia seu currículo, a inteligência artificial monta seu perfil, e a partir
            de uma vaga colada por você geramos um e-mail de candidatura que você pode
            enviar pela sua própria conta do Gmail, com o currículo anexado.
          </p>
        </Secao>

        <Secao titulo="Quais dados coletamos">
          <p>Coletamos apenas o necessário para o serviço funcionar:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-ink font-semibold">Conta Google:</strong> seu nome
              e e-mail, obtidos quando você entra com o Google.
            </li>
            <li>
              <strong className="text-ink font-semibold">Currículo e perfil:</strong> o
              arquivo do CV que você envia e os dados extraídos dele (experiência,
              formação, habilidades, links).
            </li>
            <li>
              <strong className="text-ink font-semibold">Candidaturas e tarefas:</strong>{" "}
              as vagas que você cola, os e-mails gerados e o andamento das suas
              candidaturas.
            </li>
            <li>
              <strong className="text-ink font-semibold">Autorização do Gmail:</strong>{" "}
              um token de acesso que permite enviar e-mails em seu nome, guardado de
              forma criptografada.
            </li>
          </ul>
        </Secao>

        <Secao titulo="Como usamos seus dados">
          <p>
            Seus dados são usados exclusivamente para prestar o serviço: montar seu
            perfil a partir do CV, comparar suas habilidades com a vaga, redigir o e-mail
            de candidatura e enviá-lo quando você pedir. Não vendemos nem compartilhamos
            seus dados com terceiros para publicidade.
          </p>
          <p>
            Para ler o currículo e a vaga e escrever o e-mail, o conteúdo é processado
            pela API do Google Gemini. Esse processamento acontece apenas para gerar o
            resultado que você solicitou.
          </p>
        </Secao>

        <Secao titulo="Acesso às APIs do Google e Uso Limitado">
          <p>
            A AplicaAI solicita a permissão{" "}
            <code className="font-mono text-[13px] text-text2">gmail.send</code> para{" "}
            <strong className="text-ink font-semibold">
              enviar e-mails de candidatura em seu nome
            </strong>
            . Usamos essa permissão apenas para enviar os e-mails que você mesmo revisa e
            aprova. Nunca lemos, modificamos ou apagamos as mensagens da sua caixa de
            entrada.
          </p>
          <p>
            O uso e a transferência, pela AplicaAI, das informações recebidas das APIs do
            Google seguem a{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              Política de Dados do Usuário dos Serviços de API do Google
            </a>
            , incluindo os requisitos de Uso Limitado (Limited Use).
          </p>
        </Secao>

        <Secao titulo="Onde seus dados ficam">
          <p>
            Seus dados são armazenados no Supabase (banco de dados PostgreSQL hospedado na
            região de São Paulo). Cada usuário só acessa os próprios dados, isolados no
            nível do banco. O token que autoriza o envio pelo Gmail é guardado
            criptografado.
          </p>
        </Secao>

        <Secao titulo="Seus direitos">
          <p>
            Você pode editar seu perfil a qualquer momento e apagar seus dados quando
            quiser. Para solicitar a exclusão completa da sua conta e de tudo o que está
            associado a ela, escreva para{" "}
            <a
              href={`mailto:${CONTATO}`}
              className="text-pine underline underline-offset-2 hover:text-pine-dark"
            >
              {CONTATO}
            </a>
            . Revogar o acesso do Gmail também pode ser feito a qualquer momento nas
            configurações da sua Conta Google.
          </p>
        </Secao>

        <Secao titulo="Contato">
          <p>
            Dúvidas sobre esta política ou sobre seus dados? Fale com a gente em{" "}
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
