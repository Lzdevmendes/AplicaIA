import { test, expect, type Page } from "@playwright/test";

/**
 * dnd-kit usa PointerSensor com activationConstraint distance:6 — precisa de
 * pointerdown, movimento em passos (>6px) e pointerup. O dragTo do Playwright
 * faz drag HTML5, que o dnd-kit não escuta; por isso o mouse manual.
 */
async function dragCardToColumn(page: Page, taskKey: string, targetTestId: string) {
  const card = page.locator(`[data-task-key="${taskKey}"]`).first();
  const target = page.getByTestId(targetTestId);

  const cb = await card.boundingBox();
  const tb = await target.boundingBox();
  if (!cb || !tb) throw new Error("card ou coluna sem bounding box");

  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.mouse.down();
  // passos intermediários para vencer o distance:6 e ativar o droppable
  const steps = 12;
  const toX = tb.x + tb.width / 2;
  const toY = tb.y + 120;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(
      cb.x + cb.width / 2 + ((toX - cb.x - cb.width / 2) * i) / steps,
      cb.y + cb.height / 2 + ((toY - cb.y - cb.height / 2) * i) / steps,
    );
  }
  await page.mouse.up();
  // moveTask (server action) + router.refresh() precisam assentar antes do
  // próximo passo, senão um reload logo em seguida corre com o write.
  await page.waitForLoadState("networkidle");
}

test.describe("tarefas", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tarefas");
    await expect(page.getByRole("heading", { name: "Sua semana de busca" })).toBeVisible();
  });

  test("abre o drawer e marca uma subtarefa", async ({ page }) => {
    // AP-1 tem 3 subtarefas.
    await page.locator('[data-task-key="AP-1"]').first().click();

    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Subtarefas")).toBeVisible();

    // O progresso muda ao marcar uma subtarefa ainda não feita.
    const before = await drawer.getByText(/\d\/\d/).first().textContent();
    await drawer.getByRole("button", { name: /pytest|Enviar|Conferir/ }).first().click();
    await expect
      .poll(async () => drawer.getByText(/\d\/\d/).first().textContent())
      .not.toBe(before);

    // Fecha com Escape.
    await page.keyboard.press("Escape");
    await expect(drawer).not.toBeVisible();
  });

  test("arrasta um card de Backlog para A fazer e persiste", async ({ page }) => {
    // AP-3 começa em backlog.
    const card = page.locator('[data-task-key="AP-3"]').first();
    await expect(card).toBeVisible();

    const backlog = page.getByTestId("task-column-backlog");
    const todo = page.getByTestId("task-column-todo");

    // Antes: AP-3 está na coluna backlog.
    await expect(backlog.locator('[data-task-key="AP-3"]')).toBeVisible();

    await dragCardToColumn(page, "AP-3", "task-column-todo");

    // Depois: AP-3 está na coluna "A fazer" (a server action persiste + refresh).
    await expect(todo.locator('[data-task-key="AP-3"]')).toBeVisible({ timeout: 10_000 });
    await expect(backlog.locator('[data-task-key="AP-3"]')).toHaveCount(0);

    // Reload confirma que gravou no banco, não só otimista.
    await page.reload();
    await expect(
      page.getByTestId("task-column-todo").locator('[data-task-key="AP-3"]'),
    ).toBeVisible();

    // Devolve para backlog, para o teste ser repetível. Recarrega para forçar
    // a server action a completar (o assert otimista passaria antes do write).
    await dragCardToColumn(page, "AP-3", "task-column-backlog");
    await expect(
      page.getByTestId("task-column-backlog").locator('[data-task-key="AP-3"]'),
    ).toBeVisible({ timeout: 10_000 });
    await page.reload();
    await expect(
      page.getByTestId("task-column-backlog").locator('[data-task-key="AP-3"]'),
    ).toBeVisible({ timeout: 10_000 });
  });
});
