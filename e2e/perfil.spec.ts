import { test, expect } from "@playwright/test";

test.describe("perfil editável", () => {
  test("edita um campo, salva e persiste após reload", async ({ page }) => {
    await page.goto("/perfil");

    const original = "Desenvolvedora Back-end · Pleno";
    const editado = "Back-end · Pleno [e2e]";

    // Entra no modo de edição.
    await page.getByRole("button", { name: "Editar perfil" }).click();
    const headline = page.getByLabel("Headline");
    await expect(headline).toBeVisible();

    // Troca a headline e salva.
    await headline.fill(editado);
    await page.getByRole("button", { name: "Salvar" }).click();

    // Volta ao modo leitura com o novo valor.
    await expect(page.getByRole("button", { name: "Editar perfil" })).toBeVisible();
    await expect(page.getByText(editado)).toBeVisible();

    // Reload confirma que gravou no banco, não só otimista.
    await page.reload();
    await expect(page.getByText(editado)).toBeVisible();

    // Restaura o valor original, para o teste ser repetível.
    await page.getByRole("button", { name: "Editar perfil" }).click();
    await page.getByLabel("Headline").fill(original);
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText(original)).toBeVisible();
  });

  test("adiciona e remove uma skill no modo edição", async ({ page }) => {
    await page.goto("/perfil");
    await page.getByRole("button", { name: "Editar perfil" }).click();

    const input = page.getByPlaceholder("Digite uma skill e Enter");
    await input.fill("E2ESkill");
    await input.press("Enter");
    // O chip aparece.
    const chip = page.getByText("E2ESkill", { exact: true });
    await expect(chip).toBeVisible();

    // Remove pelo × e o chip some.
    await page.getByRole("button", { name: "Remover E2ESkill" }).click();
    await expect(chip).toHaveCount(0);

    // Cancela para não persistir nada.
    await page.getByRole("button", { name: "Cancelar" }).click();
  });
});
