import { describe, it, expect } from "vitest";
import { extractPdfLinkAnnotations } from "./pdf-links";

const pdf = (s: string) => Buffer.from(s, "latin1");

describe("extractPdfLinkAnnotations", () => {
  it("extrai github e linkedin das anotações de link", () => {
    const buf = pdf(
      "/Annot /URI(http://github.com/Lzdevmendes)\n" +
        "/Annot /URI(http://www.linkedin.com/in/lzmendess)",
    );
    expect(extractPdfLinkAnnotations(buf)).toEqual({
      github: "github.com/Lzdevmendes",
      linkedin: "linkedin.com/in/lzmendess",
    });
  });

  it("ignora as URLs de metadados XMP (Adobe, Dublin Core, RDF)", () => {
    const buf = pdf(
      'xmlns:pdf="http://ns.adobe.com/pdf/1.3/" ' +
        'xmlns:dc="http://purl.org/dc/elements/1.1/" ' +
        'xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"',
    );
    expect(extractPdfLinkAnnotations(buf)).toEqual({});
  });

  it("preenche website só quando há um único candidato distinto", () => {
    const um = pdf("/URI(https://marianaribeiro.dev)");
    expect(extractPdfLinkAnnotations(um).website).toBe("marianaribeiro.dev");

    const dois = pdf("/URI(https://a.dev) /URI(https://b.io)");
    expect(extractPdfLinkAnnotations(dois).website).toBeUndefined();
  });

  it("prefere a URL de perfil do linkedin (/in/) a outros links", () => {
    const buf = pdf(
      "/URI(https://www.linkedin.com/feed/post/123) " +
        "/URI(https://www.linkedin.com/in/lzmendess)",
    );
    expect(extractPdfLinkAnnotations(buf).linkedin).toBe("linkedin.com/in/lzmendess");
  });

  it("retorna vazio quando o PDF não tem link nenhum", () => {
    expect(extractPdfLinkAnnotations(pdf("texto sem links"))).toEqual({});
  });
});
