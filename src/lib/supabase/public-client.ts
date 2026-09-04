import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./config";

type PublicClientOptions = { noStore?: boolean };

export function createPublicSupabaseClient(options: PublicClientOptions = {}) {
  const { url, publishableKey } = getPublicSupabaseConfig();

  return createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    ...(options.noStore
      ? {
          global: {
            fetch: (input: RequestInfo | URL, init?: RequestInit) =>
              fetch(input, { ...init, cache: "no-store" }),
          },
        }
      : {}),
  });
}
