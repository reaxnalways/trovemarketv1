export type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

type PublicSupabaseEnvironment = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export function getPublicSupabaseConfig(
  env: PublicSupabaseEnvironment = process.env,
): PublicSupabaseConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return { url, publishableKey };
}
