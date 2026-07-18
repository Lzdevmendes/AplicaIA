import { describe, it, expect } from "vitest";
import { gmailComposeUrl } from "./deeplink";

describe("gmailComposeUrl", () => {
  it("aponta para o compositor do Gmail web", () => {
    const url = new URL(gmailComposeUrl({ to: "rh@r030.tech", subject: "s", body: "b" }));
    expect(url.host).toBe("mail.google.com");
    expect(url.searchParams.get("view")).toBe("cm");
  });

  it("preserva destinatário, assunto e corpo com acento", () => {
    const url = new URL(
      gmailComposeUrl({
        to: "rh@r030.tech",
        subject: "Candidatura — Back-end",
        body: "Olá!\nCorpo com acento: ção",
      }),
    );
    expect(url.searchParams.get("to")).toBe("rh@r030.tech");
    expect(url.searchParams.get("su")).toBe("Candidatura — Back-end");
    expect(url.searchParams.get("body")).toBe("Olá!\nCorpo com acento: ção");
  });

  it("escapa caracteres especiais (não quebra a URL)", () => {
    const url = gmailComposeUrl({
      to: "a@b.com",
      subject: "vaga & cargo = 100%",
      body: "linha 1 & linha 2",
    });
    // Parseia sem erro e recupera os valores originais.
    const parsed = new URL(url);
    expect(parsed.searchParams.get("subject") ?? parsed.searchParams.get("su")).toBe(
      "vaga & cargo = 100%",
    );
  });
});
