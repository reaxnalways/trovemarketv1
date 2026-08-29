import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

export function createPublicSupabaseClient() {
  const { url, publishableKey } = getPublicSupabaseConfig();

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
