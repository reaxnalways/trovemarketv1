import assert from "node:assert/strict";
import test from "node:test";
import { getPublicSupabaseConfig } from "./config.ts";

test("reads the public Supabase configuration", () => {
  assert.deepEqual(
    getPublicSupabaseConfig({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    }),
    {
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    },
  );
});

test("rejects missing public Supabase configuration", () => {
  assert.throws(() => getPublicSupabaseConfig({}), /environment variables are missing/);
});
