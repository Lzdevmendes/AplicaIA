import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";

// O runner do Playwright não carrega .env.local (o Next carrega sozinho no
// webServer). O auth.setup.ts precisa do Supabase URL/anon aqui.
try {
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  // sem .env.local: os testes que dependem de sessão vão falhar com mensagem clara
}

const PORT = 3199;
export const BASE_URL = `http://localhost:${PORT}`;

/**
 * e2e das telas. Sobe o próprio `next dev` e reusa uma sessão autenticada
 * (auth.setup.ts injeta o cookie via password grant do usuário de dev).
 *
 * Precisa das env vars de .env.local (Supabase + a chave). Roda: npx playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/state.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
