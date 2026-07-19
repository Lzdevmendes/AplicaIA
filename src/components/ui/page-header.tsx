/** Eyebrow + título, o padrão de cabeçalho de todas as telas do protótipo. */
export function PageHeader({
  eyebrow,
  title,
  size = 32,
  children,
}: {
  /** Vai depois de "AplicaAI · " */
  eyebrow: string;
  title: string;
  /** A tela Nova candidatura usa 34px; as demais, 32px. */
  size?: 32 | 34;
  /** Bloco alinhado à direita (métricas, ações). */
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 mb-6">
      <div>
        <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mb-2">
          AplicaAI · {eyebrow}
        </div>
        <h1
          className="font-display font-extrabold tracking-[-0.01em] m-0 leading-[1.04]"
          style={{ fontSize: size }}
        >
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}
