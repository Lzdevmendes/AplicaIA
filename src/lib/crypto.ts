import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

/**
 * Criptografia do refresh token do Google, em repouso.
 *
 * AES-256-GCM com a chave em TOKEN_ENCRYPTION_KEY (env, fora do banco). O token
 * fica cifrado na tabela google_accounts — um dump/backup do banco não expõe o
 * segredo, porque a chave vive só na aplicação. GCM ainda autentica: adulterar
 * o ciphertext faz a decifragem falhar em vez de devolver lixo.
 *
 * Server-side apenas.
 */

const ALGO = "aes-256-gcm";

function key(): Buffer {
  const k = process.env.TOKEN_ENCRYPTION_KEY;
  if (!k) throw new Error("TOKEN_ENCRYPTION_KEY não configurada. Veja .env.example.");
  const buf = Buffer.from(k, "base64");
  if (buf.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY deve ser 32 bytes em base64 (openssl rand -base64 32).");
  }
  return buf;
}

/** Cifra e serializa como `iv.tag.ciphertext`, tudo base64. */
export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

/** Reverte encryptToken. Lança se o payload foi adulterado ou está malformado. */
export function decryptToken(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("token cifrado malformado");
  }
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
