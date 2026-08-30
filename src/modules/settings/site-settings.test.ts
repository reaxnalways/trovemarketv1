import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSiteSettings } from "./site-settings.ts";

test("normalizes site settings and WhatsApp number", () => {
  const result = normalizeSiteSettings({
    siteName: " Trove Teknoloji ",
    siteTagline: " Teknoloji alışverişi ve servis ",
    whatsappNumber: "+90 (555) 123 45 67",
    whatsappDefaultMessage: " Merhaba ",
    logoUrl: "https://example.supabase.co/storage/v1/object/public/brand-assets/logo/trove.svg",
    brandWordmarkUrl: null,
  });

  assert.equal(result.siteName, "Trove Teknoloji");
  assert.equal(result.whatsappNumber, "905551234567");
  assert.equal(result.whatsappDefaultMessage, "Merhaba");
});

test("rejects logos outside the brand assets bucket", () => {
  assert.throws(() => normalizeSiteSettings({
    siteName: "Trove Teknoloji",
    siteTagline: "",
    whatsappNumber: "",
    whatsappDefaultMessage: "",
    logoUrl: "https://example.com/logo.svg",
    brandWordmarkUrl: null,
  }), /marka deposundan/);
});
