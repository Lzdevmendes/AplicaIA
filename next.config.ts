import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Existe um package-lock.json em ~/, e sem isto o Turbopack infere a home do
  // usuário como raiz do workspace.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
