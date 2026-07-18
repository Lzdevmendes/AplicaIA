import { test, expect } from "@playwright/test";

test.describe("navegação", () => {
  test("o rail leva às cinco telas", async ({ page }) => {
    await page.goto("/nova");
    await expect(page.getByRole("heading", { name: /Transforme a vaga/ })).toBeVisible();

    await page.getByRole("link", { name: "Tracker" }).click();
    await expect(page).toHaveURL(/\/tracker$/);
    await expect(page.getByRole("heading", { name: "Suas candidaturas" })).toBeVisible();

    await page.getByRole("link", { name: "Tarefas" }).click();
    await expect(page).toHaveURL(/\/tarefas$/);
    await expect(page.getByRole("heading", { name: "Sua semana de busca" })).toBeVisible();

    await page.getByRole("link", { name: "Perfil" }).click();
    await expect(page).toHaveURL(/\/perfil$/);
  });

  test("sem sessão, /nova redireciona para /login", async ({ browser }) => {
    // Contexto novo, sem o storageState autenticado.
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto("/nova");
    await expect(page).toHaveURL(/\/login$/);
    await ctx.close();
  });
});
