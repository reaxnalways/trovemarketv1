import assert from "node:assert/strict";
import test from "node:test";
import { FALLBACK_SITE_SETTINGS, resolvePublicSiteSettings } from "./public-settings.ts";

test("uses stored SVG logo and site name when available", () => {
  const settings = resolvePublicSiteSettings({
    site_name: " Trove Market ",
    logo_url: " https://example.supabase.co/storage/v1/object/public/brand-assets/logo/trove.svg ",
  });

  assert.equal(settings.site_name, "Trove Market");
  assert.equal(settings.logo_url, "https://example.supabase.co/storage/v1/object/public/brand-assets/logo/trove.svg");
});

test("falls back safely when settings are missing", () => {
  assert.deepEqual(resolvePublicSiteSettings(null), FALLBACK_SITE_SETTINGS);
});
