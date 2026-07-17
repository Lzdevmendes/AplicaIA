import { describe, it, expect, beforeAll } from "vitest";
import { randomBytes } from "crypto";
import { encryptToken, decryptToken } from "./crypto";

describe("encryptToken / decryptToken", () => {
  beforeAll(() => {
    // Chave de teste (32 bytes base64).
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  });

  it("faz round-trip de um refresh token", () => {
    const token = "1//0abc-DEF_ghi.jklmno_refresh_token_do_google";
    expect(decryptToken(encryptToken(token))).toBe(token);
  });

  it("cada cifragem usa IV novo — ciphertexts diferentes para o mesmo texto", () => {
    const a = encryptToken("mesmo-token");
    const b = encryptToken("mesmo-token");
    expect(a).not.toBe(b);
    // mas ambos decifram para o mesmo valor
    expect(decryptToken(a)).toBe(decryptToken(b));
  });

  it("o ciphertext não contém o texto em claro", () => {
    const token = "segredo-visivel";
    expect(encryptToken(token)).not.toContain(token);
  });

  it("adulterar o ciphertext faz a decifragem falhar (GCM autentica)", () => {
    const payload = encryptToken("token");
    const [iv, tag, ct] = payload.split(".");
    // troca um byte do ciphertext
    const tampered = Buffer.from(ct, "base64");
    tampered[0] ^= 0xff;
    const bad = [iv, tag, tampered.toString("base64")].join(".");
    expect(() => decryptToken(bad)).toThrow();
  });

  it("payload malformado é rejeitado", () => {
    expect(() => decryptToken("nao-tem-pontos")).toThrow("malformado");
  });

  it("chave de tamanho errado é rejeitada", () => {
    const original = process.env.TOKEN_ENCRYPTION_KEY;
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from("curta").toString("base64");
    expect(() => encryptToken("x")).toThrow("32 bytes");
    process.env.TOKEN_ENCRYPTION_KEY = original;
  });
});
