import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a Service Role Key — ignora RLS (Row Level
 * Security) completamente.
 *
 * USAR APENAS em código server-side de confiança (rotas de webhook, jobs
 * internos) que precisam ler/escrever dados de QUALQUER usuário sem haver
 * uma sessão de usuário autenticada no momento da chamada — como é o caso
 * do webhook da Kiwify, que chega como uma chamada servidor-a-servidor sem
 * cookies de sessão.
 *
 * NUNCA importar este client em código que roda no browser ou em
 * componentes client — a Service Role Key teria que ser exposta no bundle,
 * o que destruiria toda a segurança do banco.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados nas variáveis de ambiente."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
