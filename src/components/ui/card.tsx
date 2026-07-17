/** Card branco padrão do protótipo: borda #E7E5DF, raio 8px, sombra leve. */
export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={[
        "bg-surface border border-border rounded-lg shadow-flat",
        padded ? "px-[22px] py-5" : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Label mono uppercase que abre cada seção. */
export function CardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[11px] tracking-[0.1em] uppercase text-muted mb-3">
      {children}
    </div>
  );
}
