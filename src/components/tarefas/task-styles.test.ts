import { describe, it, expect, vi, afterEach } from "vitest";
import { dueLabel, priorityStyle, PRIORITY_LABEL } from "./task-styles";

describe("dueLabel", () => {
  afterEach(() => vi.useRealTimers());

  it("sem prazo → 'sem prazo', não urgente", () => {
    expect(dueLabel(null)).toEqual({ text: "sem prazo", urgent: false });
  });

  it("prazo de hoje → 'hoje' e urgente", () => {
    vi.setSystemTime(new Date("2026-07-16T12:00:00"));
    const r = dueLabel("2026-07-16");
    expect(r.text).toBe("hoje");
    expect(r.urgent).toBe(true);
  });

  it("prazo passado → urgente, com dia/mês abreviado", () => {
    vi.setSystemTime(new Date("2026-07-16T12:00:00"));
    const r = dueLabel("2026-07-10");
    expect(r.urgent).toBe(true);
    expect(r.text).toBe("10 jul");
  });

  it("prazo futuro → não urgente", () => {
    vi.setSystemTime(new Date("2026-07-16T12:00:00"));
    const r = dueLabel("2026-07-20");
    expect(r.urgent).toBe(false);
    expect(r.text).toBe("20 jul");
  });
});

describe("priorityStyle / PRIORITY_LABEL", () => {
  it("alta usa o âmbar; feito usa o verde-tinta", () => {
    expect(priorityStyle("alta").color).toBe("#C77A16");
    expect(priorityStyle("feito").color).toBe("#10855F");
  });

  it("os rótulos cobrem os 4 valores do enum", () => {
    expect(Object.keys(PRIORITY_LABEL).sort()).toEqual(
      ["alta", "baixa", "feito", "media"].sort(),
    );
    expect(PRIORITY_LABEL.media).toBe("média");
  });
});
