import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Rota de callback para confirmação de e-mail (cadastro, magic link,
 * troca de e-mail, etc).
 *
 * O Supabase, ao enviar o e-mail de confirmação, gera um link que
 * aponta para esta rota com um `token_hash` e um `type` na query
 * string. Esta rota troca esse token por uma sessão real (cookies de
 * autenticação), e só então redireciona o usuário para o destino
 * final — sem esse passo, o usuário chegaria ao destino sem estar
 * realmente autenticado, e o middleware o jogaria de volta para
 * /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Permite sobrescrever o destino via `?next=/algum-lugar`, mas usa
  // /dashboard como padrão -- é para onde o usuário deve ir depois de
  // confirmar o cadastro.
  const next = searchParams.get("next") ?? "/dashboard";

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete("token_hash");
  redirectTo.searchParams.delete("type");
  redirectTo.searchParams.delete("next");

  if (token_hash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  // Token inválido, expirado, ou já utilizado -- manda para o login
  // com um aviso, em vez de deixar o usuário numa página quebrada.
  const errorRedirect = request.nextUrl.clone();
  errorRedirect.pathname = "/login";
  errorRedirect.search = "";
  errorRedirect.searchParams.set("erro", "confirmacao_invalida");
  return NextResponse.redirect(errorRedirect);
}
