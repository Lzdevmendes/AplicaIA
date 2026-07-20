import { describe, it, expect } from "vitest";
import { detectDocType, PDF_MIME, DOCX_MIME } from "./doc-types";

describe("detectDocType", () => {
  it("reconhece pelo MIME", () => {
    expect(detectDocType("curriculo", PDF_MIME)).toBe("pdf");
    expect(detectDocType("curriculo", DOCX_MIME)).toBe("docx");
  });

  it("cai na extensão quando o MIME vem vazio (PDF do Chrome)", () => {
    expect(detectDocType("Meu CV.pdf", "")).toBe("pdf");
    expect(detectDocType("cv.docx", "")).toBe("docx");
  });

  it("é case-insensitive em extensão e MIME", () => {
    expect(detectDocType("CV.PDF", "")).toBe("pdf");
    expect(detectDocType("cv", "APPLICATION/PDF")).toBe("pdf");
  });

  it("rejeita tipos não suportados", () => {
    expect(detectDocType("cv.doc", "application/msword")).toBeNull();
    expect(detectDocType("print.png", "image/png")).toBeNull();
    expect(detectDocType("cv.txt", "")).toBeNull();
  });
});
