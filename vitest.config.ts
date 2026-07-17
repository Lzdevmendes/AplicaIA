import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolve o alias @/ do tsconfig nativamente (sem plugin).
  resolve: { tsconfigPaths: true },
  test: {
    // Funções puras e de servidor — não precisam de DOM.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
