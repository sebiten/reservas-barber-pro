import { createClient } from "@supabase/supabase-js";
import { getRequiredServerEnv } from "@/lib/env";

export function getSupabaseAdmin() {
  const hasConfig =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasConfig) {
    return null;
  }

  const { supabaseUrl, supabaseServiceRoleKey } = getRequiredServerEnv();

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
