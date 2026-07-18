import { describe, it, expect } from "vitest";
import { buildMimeMessage, toBase64Url } from "./gmail";

describe("buildMimeMessage", () => {
  const base = {
    to: "recrutamento@r030.tech",
    from: "mariana@gmail.com",
    subject: "Candidatura — Desenvolvedora Back-end (Python)",
    body: "Olá, time da R030!\n\nVi a vaga.\n\nAbraço,\nMariana",
  };

  it("inclui os headers To/From", () => {
    const mime = buildMimeMessage(base);
    expect(mime).toContain("To: recrutamento@r030.tech");
    expect(mime).toContain("From: mariana@gmail.com");
  });

  it("codifica o assunto em RFC 2047 e ele decodifica de volta", () => {
    const mime = buildMimeMessage(base);
    const match = mime.match(/Subject: =\?UTF-8\?B\?([^?]+)\?=/);
    expect(match).not.toBeNull();
    const decoded = Buffer.from(match![1], "base64").toString("utf-8");
    expect(decoded).toBe(base.subject);
  });

  it("usa CRLF entre as linhas", () => {
    expect(buildMimeMessage(base)).toContain("\r\n");
  });

  it("sem anexo: é text/plain simples, não multipart", () => {
    const mime = buildMimeMessage(base);
    expect(mime).toContain('Content-Type: text/plain; charset="UTF-8"');
    expect(mime).not.toContain("multipart/mixed");
  });

  it("com anexo: multipart com o PDF em base64 e o nome do arquivo", () => {
    const cvBase64 = Buffer.from("%PDF-1.4 fake").toString("base64");
    const mime = buildMimeMessage({
      ...base,
      attachment: { filename: "Mariana-CV.pdf", mimeType: "application/pdf", base64: cvBase64 },
    });
    expect(mime).toContain("multipart/mixed");
    expect(mime).toContain('filename="Mariana-CV.pdf"');
    expect(mime).toContain("Content-Disposition: attachment");
    expect(mime).toContain(cvBase64);
    // O boundary abre duas vezes e fecha uma (--boundary--).
    const boundary = mime.match(/boundary="([^"]+)"/)![1];
    const opens = mime.split(`--${boundary}`).length - 1;
    expect(opens).toBe(3);
  });

  it("preserva o corpo (decodifica igual)", () => {
    const mime = buildMimeMessage(base);
    const bodyB64 = Buffer.from(base.body, "utf-8").toString("base64");
    expect(mime).toContain(bodyB64);
  });
});

describe("toBase64Url", () => {
  it("não contém +, / nem = (formato que o Gmail espera em `raw`)", () => {
    const mime = buildMimeMessage({
      to: "a@b.com",
      from: "c@d.com",
      subject: "áçãõ com bytes que geram + e /",
      body: "corpo qualquer ~~~ ???",
    });
    const url = toBase64Url(mime);
    expect(url).not.toMatch(/[+/=]/);
  });

  it("é reversível para os bytes originais", () => {
    const original = "conteúdo com acento e símbolos: +/=";
    const url = toBase64Url(original);
    const back = Buffer.from(
      url.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf-8");
    expect(back).toBe(original);
  });
});
