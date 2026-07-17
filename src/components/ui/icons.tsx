/**
 * Ícones extraídos dos SVGs inline do protótipo (AplicaAI.dc.html).
 * Traço 1.7 e viewBox 24 são o padrão da maquete; não trocar por lib de ícones
 * sem comparar lado a lado com os screenshots do handoff.
 */

type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
});

export function LogoMark({ size = 20 }: IconProps) {
  return (
    <svg {...base(size)}>
      <path d="M12 2 4.5 20.5 12 16l7.5 4.5L12 2Z" fill="#10855F" />
      <path d="M12 2 12 16l7.5 4.5L12 2Z" fill="#0c6a4b" />
    </svg>
  );
}

export function IconPlus({ size = 21, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconTracker({ size = 21, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="3.5" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="11" rx="1" />
      <rect x="16.5" y="4" width="5" height="14" rx="1" />
    </svg>
  );
}

export function IconTasks({ size = 21, className }: IconProps) {
  return (
    <svg
      {...base(size)}
      className={className}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 4v16M3 9h5m-5 5h5" />
      <path d="m13 10 2 2 3.5-3.5" />
    </svg>
  );
}

export function IconProfile({ size = 21, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function IconUpload({ size = 20, className }: IconProps) {
  return (
    <svg
      {...base(size)}
      className={className}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V4m0 0L8 8m4-4 4 4" />
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function IconSparkle({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

export function IconSend({ size = 16, className }: IconProps) {
  return (
    <svg
      {...base(size)}
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 4 11 13M22 4l-7 18-4-9-9-4 20-5Z" />
    </svg>
  );
}

export function IconRefresh({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M20 11a8 8 0 1 0-2.3 5.6M20 4v5h-5" />
    </svg>
  );
}

export function IconDoc({ size = 16, className, color = "currentColor" }: IconProps & { color?: string }) {
  return (
    <svg {...base(size)} className={className} stroke={color} strokeWidth="1.6">
      <path d="M14 3v5h5" strokeLinejoin="round" />
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function IconEnvelope({ size = 30, className, color = "#C9C6BF" }: IconProps & { color?: string }) {
  return (
    <svg {...base(size)} className={className} stroke={color} strokeWidth="1.4" strokeLinejoin="round">
      <path d="M4 6h16v12H4z" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

export function IconImage({ size = 34, className, color = "#6B7076" }: IconProps & { color?: string }) {
  return (
    <svg {...base(size)} className={className} stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 5-4 3.5 2.5L17 11l3 3" />
    </svg>
  );
}

export function IconCalendar({ size = 12, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v3m8-3v3" />
    </svg>
  );
}

export function IconChecklist({ size = 13, className }: IconProps) {
  return (
    <svg
      {...base(size)}
      className={className}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

export function IconCheck({ size = 12, className, color = "#fff", strokeWidth = 3 }: IconProps & { color?: string; strokeWidth?: number }) {
  return (
    <svg {...base(size)} className={className} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l5 5L20 6" />
    </svg>
  );
}

export function IconCheckCircle({ size = 16, className, color = "#10855F" }: IconProps & { color?: string }) {
  return (
    <svg {...base(size)} className={className} stroke={color} strokeWidth="1.7">
      <path d="m9 12 2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

export function IconChevronRight({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export function IconChevronLeft({ size = 15, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export function IconClose({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className} stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
