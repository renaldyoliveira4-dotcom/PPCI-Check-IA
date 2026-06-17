import { createClient } from "./supabase/server";

/**
 * Busca o usuário autenticado + seu perfil (incluindo saldo de tokens).
 * Use em Server Components que renderizam o AppShell.
 */
export async function getUserContext() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, tokens, tokens_used, plan, active_state, is_admin")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
