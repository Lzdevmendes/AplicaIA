/**
 * Converte um ArrayBuffer para base64 em blocos.
 *
 * O caminho ingênuo — `btoa(String.fromCharCode(...new Uint8Array(buf)))` —
 * passa um argumento por byte e estoura a pilha (RangeError) acima de ~150 KB,
 * ou seja, em qualquer print de vaga real. Fatiar em blocos de 32 KB mantém a
 * lista de argumentos dentro do limite do motor.
 */
export function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const CHUNK = 0x8000; // 32.768 bytes por chamada de fromCharCode
  let binary = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
