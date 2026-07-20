/**
 * Detecção do tipo de documento do CV.
 *
 * Decide por MIME e, no fallback, pela extensão do nome — porque nem sempre o
 * browser preenche `file.type` (PDFs salvos/impressos pelo Chrome costumam vir
 * com MIME vazio, e sem o fallback eram rejeitados como se não fossem PDF).
 */

export type DocType = "pdf" | "docx";

export const PDF_MIME = "application/pdf";
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const DOC_CONTENT_TYPE: Record<DocType, string> = {
  pdf: PDF_MIME,
  docx: DOCX_MIME,
};

/** Aceito no atributo `accept` do input de arquivo. */
export const DOC_ACCEPT = [".pdf", ".docx", PDF_MIME, DOCX_MIME].join(",");

/** `pdf` | `docx` | null (não suportado — ex.: .doc antigo, imagem). */
export function detectDocType(name: string, mime: string): DocType | null {
  const m = mime.trim().toLowerCase();
  if (m === PDF_MIME) return "pdf";
  if (m === DOCX_MIME) return "docx";

  const ext = name.trim().toLowerCase().split(".").pop();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  return null;
}
