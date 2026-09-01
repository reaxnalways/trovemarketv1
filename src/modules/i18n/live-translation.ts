import type { Locale } from "./index";

type AiBinding = {
  run: (
    model: string,
    input: { text: string; source_lang: string; target_lang: string },
  ) => Promise<{ translated_text?: string } | string>;
};

type KvBinding = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

type RuntimeEnv = {
  AI?: AiBinding;
  VINEXT_KV_CACHE?: KvBinding;
};

const MODEL = "@cf/meta/m2m100-1.2b";
const CACHE_PREFIX = "trove:i18n:v1";
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 90;

async function getRuntimeEnv(): Promise<RuntimeEnv | null> {
  try {
    // Keep Next.js' normal Node build independent from Cloudflare-native modules.
    // Vinext resolves this native module at runtime inside workerd.
    const moduleName = "cloudflare:workers";
    const runtime = (await import(/* webpackIgnore: true */ moduleName)) as { env?: RuntimeEnv };
    return runtime.env ?? null;
  } catch {
    return null;
  }
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function translatedText(result: { translated_text?: string } | string): string | null {
  if (typeof result === "string") return result.trim() || null;
  return result.translated_text?.trim() || null;
}

export async function translateText(
  source: string | null | undefined,
  locale: Locale,
): Promise<string> {
  const text = source?.trim() ?? "";
  if (!text || locale === "tr") return text;

  const runtime = await getRuntimeEnv();
  if (!runtime?.AI) return text;

  const hash = await sha256(`tr:${locale}:${text}`);
  const cacheKey = `${CACHE_PREFIX}:${hash}`;

  try {
    const cached = await runtime.VINEXT_KV_CACHE?.get(cacheKey);
    if (cached) return cached;
  } catch {
    // Translation must never make the page unavailable if cache access fails.
  }

  try {
    const result = await runtime.AI.run(MODEL, {
      text,
      source_lang: "turkish",
      target_lang: "english",
    });
    const translation = translatedText(result) ?? text;

    if (translation !== text) {
      try {
        await runtime.VINEXT_KV_CACHE?.put(cacheKey, translation, {
          expirationTtl: CACHE_TTL_SECONDS,
        });
      } catch {
        // A successful translation is still useful even when cache write fails.
      }
    }

    return translation;
  } catch {
    return text;
  }
}

export async function translateTexts<T extends Record<string, string | null | undefined>>(
  values: T,
  locale: Locale,
): Promise<{ [K in keyof T]: string }> {
  const entries = await Promise.all(
    Object.entries(values).map(async ([key, value]) => [key, await translateText(value, locale)] as const),
  );
  return Object.fromEntries(entries) as { [K in keyof T]: string };
}
