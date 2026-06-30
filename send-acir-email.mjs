// send-acir-email.mjs
// Script para enviar email de retomada para o Acir via Resend
// Rodar com: node send-acir-email.mjs

import { Resend } from "resend";

// ⚠️ COLE SUA API KEY DO RESEND AQUI (ou use variável de ambiente)
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_COLE_SUA_KEY_AQUI";

const resend = new Resend(RESEND_API_KEY);

const textBody = `Oi Acir, tudo bem?

Aqui é o Renaldy, fundador do PPCI Check IA.

Vi que você criou sua conta ontem cedo, mas ainda não voltou pra fazer a primeira análise. Faz total sentido — quando estamos no celular, raramente temos o projeto na mão pra testar.

Queria só confirmar: tudo certo com o cadastro? Conseguiu confirmar o e-mail sem problema?

Deixei seus 10 tokens grátis esperando lá na sua conta. Quando estiver no escritório com algum PPCI seu (mesmo um antigo, só pra testar), é só logar aqui:

https://www.ppcicheckia.com.br/dashboard

Qualquer dúvida sobre o produto, pode me responder direto neste e-mail ou chamar no WhatsApp do site.

Se quiser entender melhor antes de testar, te explico como a IA analisa contra o Decreto 16.302/2015 e as ITs do CBM-BA — falo a tua língua, sou arquiteto também.

Abraço,
Renaldy Oliveira
PPCI Check IA`;

const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 20px;">
  <p>Oi Acir, tudo bem?</p>
  
  <p>Aqui é o Renaldy, fundador do PPCI Check IA.</p>
  
  <p>Vi que você criou sua conta ontem cedo, mas ainda não voltou pra fazer a primeira análise. Faz total sentido — quando estamos no celular, raramente temos o projeto na mão pra testar.</p>
  
  <p>Queria só confirmar: <strong>tudo certo com o cadastro?</strong> Conseguiu confirmar o e-mail sem problema?</p>
  
  <p>Deixei seus <strong>10 tokens grátis</strong> esperando lá na sua conta. Quando estiver no escritório com algum PPCI seu (mesmo um antigo, só pra testar), é só logar aqui:</p>
  
  <p style="margin: 24px 0;">
    <a href="https://www.ppcicheckia.com.br/dashboard" style="background: #e85d04; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Acessar minha conta</a>
  </p>
  
  <p>Qualquer dúvida sobre o produto, pode me responder direto neste e-mail ou chamar no WhatsApp do site.</p>
  
  <p>Se quiser entender melhor antes de testar, te explico como a IA analisa contra o <strong>Decreto 16.302/2015</strong> e as <strong>ITs do CBM-BA</strong> — falo a tua língua, sou arquiteto também.</p>
  
  <p style="margin-top: 32px;">
    Abraço,<br>
    <strong>Renaldy Oliveira</strong><br>
    <span style="color: #666;">PPCI Check IA</span>
  </p>
</body>
</html>`;

try {
  const { data, error } = await resend.emails.send({
    from: "Renaldy Oliveira <naoresponda@ppcicheckia.com.br>",
    to: ["acirpereiradossantos4@gmail.com"],
    reply_to: "renaldyoliveira@gmail.com",
    subject: "Tudo bem com seu cadastro no PPCI Check IA, Acir?",
    text: textBody,
    html: htmlBody,
  });

  if (error) {
    console.error("❌ Erro ao enviar:", error);
    process.exit(1);
  }

  console.log("✅ Email enviado com sucesso!");
  console.log("ID do email:", data.id);
} catch (err) {
  console.error("❌ Erro inesperado:", err);
  process.exit(1);
}
