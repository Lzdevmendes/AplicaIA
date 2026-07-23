import { describe, it, expect } from "vitest";
import { toBase64 } from "./to-base64";

/** Bytes pseudoaleatórios determinísticos — cobre a faixa 0..255 inteira. */
function bytes(n: number): ArrayBuffer {
  const a = new Uint8Array(n);
  for (let i = 0; i < n; i++) a[i] = (i * 31 + 7) % 256;
  return a.buffer;
}

describe("toBase64", () => {
  it("bate com o base64 de referência", () => {
    const buf = bytes(1000);
    expect(toBase64(buf)).toBe(Buffer.from(buf).toString("base64"));
  });

  it("converte um print de 300 KB sem estourar a pilha", () => {
    // O caminho antigo (String.fromCharCode(...bytes)) lançava RangeError
    // acima de ~150 KB — qualquer print de vaga real.
    const buf = bytes(300 * 1024);
    expect(toBase64(buf)).toBe(Buffer.from(buf).toString("base64"));
  });

  it("lida com tamanhos que não fecham no bloco de 32 KB", () => {
    for (const n of [0, 1, 2, 0x8000, 0x8000 + 1, 0x8000 * 2 + 3]) {
      const buf = bytes(n);
      expect(toBase64(buf)).toBe(Buffer.from(buf).toString("base64"));
    }
  });
});
