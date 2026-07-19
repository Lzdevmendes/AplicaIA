import type { NextConfig } from "next";

// Headers de segurança aplicados a todas as respostas. CSP conservador: trava
// clickjacking (frame-ancestors), plugins (object-src) e injeção de <base>.
// script-src/style-src ficam de fora por ora — exigiriam nonce no App Router e
// podem quebrar o inline do Next/Tailwind; anotado como melhoria futura.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
];

const nextConfig: NextConfig = {
  // Existe um package-lock.json em ~/, e sem isto o Turbopack infere a home do
  // usuário como raiz do workspace.
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
