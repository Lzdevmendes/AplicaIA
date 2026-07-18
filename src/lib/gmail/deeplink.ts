/**
 * Monta o link que abre um rascunho pré-preenchido no Gmail web.
 *
 * É o fallback enquanto a verificação OAuth do Google não sai: o e-mail não é
 * enviado pela API, o usuário confere, anexa o CV na mão e clica enviar. O
 * anexo não vai automático por aqui — o Gmail não aceita anexo por URL.
 */
export function gmailComposeUrl(params: {
  to: string;
  subject: string;
  body: string;
}) {
  const q = new URLSearchParams({
    view: "cm",
    fs: "1",
    to: params.to,
    su: params.subject,
    body: params.body,
  });
  return `https://mail.google.com/mail/?${q.toString()}`;
}
