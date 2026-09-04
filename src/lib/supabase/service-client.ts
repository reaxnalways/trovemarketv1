import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

export function hasSupabaseServiceRoleKey(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function createSupabaseServiceClient() {
  const { url } = getPublicSupabaseConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
