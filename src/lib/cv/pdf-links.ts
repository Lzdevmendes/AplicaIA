/**
 * Extrai as URLs de hyperlink embutidas num PDF de CV.
 *
 * EXCEÇÃO à regra "não parsear PDF" do AGENTS.md — e a única. O Gemini lê o PDF
 * nativamente, mas NÃO recebe a camada de anotação de link: quando o CV mostra
 * "GitHub"/"LinkedIn" como ícone ou label clicável, a URL vive só no `/URI` da
 * anotação e o modelo devolve string vazia. Aqui varremos apenas essas URLs
 * (não é OCR nem leitura de conteúdo) para completar github/linkedin/website
 * quando o modelo não achou. Não substitui a leitura do Gemini — só a
 * complementa no que ele comprovadamente não enxerga.
 */

export type PdfLinks = {
  github?: string;
  linkedin?: string;
  website?: string;
};

// Hosts que aparecem em toda metadados XMP de PDF (Adobe, Dublin Core, RDF).
// Nunca são o site do candidato — descartamos antes de considerar website.
const METADATA_HOSTS = new Set([
  "ns.adobe.com",
  "purl.org",
  "www.w3.org",
  "w3.org",
  "iptc.org",
  "aiim.org",
  "schemas.openxmlformats.org",
]);

/** Tira protocolo e `www.`, deixando no formato "github.com/usuario". */
function normalize(url: string): string {
  return url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
}

function shortest(urls: string[]): string {
  return [...urls].sort((a, b) => a.length - b.length)[0];
}

export function extractPdfLinkAnnotations(pdf: Buffer): PdfLinks {
  // latin1 preserva os bytes 1:1; as anotações de link ficam em texto plano
  // (fora dos streams comprimidos) na esmagadora maioria dos PDFs de CV.
  const text = pdf.toString("latin1");
  const urls = [...text.matchAll(/https?:\/\/[^\s()<>"'\\]+/gi)].map((m) =>
    m[0].replace(/[.,;]+$/, ""),
  );

  const github: string[] = [];
  const linkedin: string[] = [];
  const website: string[] = [];

  for (const raw of urls) {
    const clean = normalize(raw);
    const host = clean.split("/")[0].toLowerCase();
    if (host === "github.com" && clean.length > "github.com/".length) {
      github.push(clean);
    } else if (host === "linkedin.com") {
      linkedin.push(clean);
    } else if (!METADATA_HOSTS.has(host)) {
      website.push(clean);
    }
  }

  const result: PdfLinks = {};
  if (github.length) result.github = shortest(github);
  if (linkedin.length) {
    // Prefere a URL de perfil (/in/…) a links de post/empresa.
    const profiles = linkedin.filter((u) => u.toLowerCase().includes("/in/"));
    result.linkedin = shortest(profiles.length ? profiles : linkedin);
  }
  // website só quando há um único candidato distinto — evita gravar lixo
  // (URLs de fonte, tracker ou de vaga que por acaso estejam no PDF).
  const uniqueSites = [...new Set(website)];
  if (uniqueSites.length === 1) result.website = uniqueSites[0];

  return result;
}
